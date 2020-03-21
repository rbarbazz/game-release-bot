import { Message, User } from 'discord.js';
import { MongoClient } from 'mongodb';

import { sendCodeMessage, sendGameList, formatGameList } from './sendMessage';
import { searchGames, getGameDetails } from './search';
import { getDbClient, prefix } from './bot';

const gamePrefixUrl = 'https://rawg.io/games/';

const collectIndexFromUser = async (
  message: Message,
  maxLength: number,
): Promise<number> => {
  const { channel, author } = message;
  const filter = (
    response: { content: string; author: User },
    author: User,
    maxLength: number,
  ) => {
    if (response.author.id !== author.id) return false;
    const responseInt = parseInt(response.content) - 1;

    return (
      response.content.startsWith(prefix) ||
      (responseInt < maxLength && responseInt >= -1)
    );
  };

  const collected = await channel.awaitMessages(
    response => filter(response, author, maxLength),
    {
      maxMatches: 1,
      time: 30000,
      errors: ['time'],
    },
  );
  const { content } = collected.first();

  if (content.startsWith(prefix)) return -1;
  return parseInt(content) - 1;
};

const getUserGameList = async (message: Message, dbClient: MongoClient) => {
  const { author } = message;
  const users = dbClient.db('game-release-bot').collection('users');
  const games = dbClient.db('game-release-bot').collection('games');
  const currentUser: UserEntry = await users.findOne({ userId: author.id });
  if (currentUser === null) return [];

  let userGameList = await games
    .find({ gameId: { $in: currentUser.gameList } })
    .toArray();
  userGameList.sort(
    (a, b) =>
      a.tba || new Date(a.released).getTime() - new Date(b.released).getTime(),
  );
  return userGameList;
};

export const searchCommand = async (args: string[], message: Message) => {
  const results = await searchGames(args.join(' '));
  const { channel } = message;

  if (results.length > 0) {
    sendGameList(results, channel);
    try {
      const indexSelected = await collectIndexFromUser(message, results.length);
      if (indexSelected === -1) {
        sendCodeMessage(channel, 'Operation cancelled');
        return;
      }
      const gameSelected = results[indexSelected];
      const gameDetails = await getGameDetails(gameSelected.id);

      sendCodeMessage(
        channel,
        `# ${gameDetails.name}\n\n${gameDetails.description_raw}`,
        true,
      );
      channel.send(`${gamePrefixUrl}${gameDetails.slug}`);
    } catch {}
  } else {
    sendCodeMessage(channel, 'No results found sorry');
  }
};

export const addCommand = async (args: string[], message: Message) => {
  const results = await searchGames(args.join(' '));
  const { channel, author } = message;

  if (results.length > 0) {
    sendGameList(results, channel, true);

    try {
      const indexSelected = await collectIndexFromUser(message, results.length);
      if (indexSelected === -1) {
        sendCodeMessage(channel, 'Operation cancelled');
        return;
      }
      const gameSelected = results[indexSelected];
      const gameDetails = await getGameDetails(gameSelected.id);

      const dbClient = getDbClient();
      dbClient.connect(async error => {
        if (error !== null) {
          console.error(error);
          return;
        }
        const users = dbClient.db('game-release-bot').collection('users');
        const games = dbClient.db('game-release-bot').collection('games');

        await users.updateOne(
          { userId: author.id },
          {
            $addToSet: {
              gameList: gameDetails.id,
            },
          },
          { upsert: true },
        );
        await games.updateOne(
          { gameId: gameDetails.id },
          gameDetails.tba
            ? {
                $set: {
                  gameId: gameDetails.id,
                  name: gameDetails.name,
                  tba: gameDetails.tba,
                },
              }
            : {
                $set: {
                  gameId: gameDetails.id,
                  name: gameDetails.name,
                  released: gameDetails.released,
                  tba: gameDetails.tba,
                },
              },
          { upsert: true },
        );

        dbClient.close();
      });
      sendCodeMessage(
        channel,
        `< ${gameDetails.name} > added to your list`,
        true,
      );
    } catch {}
  } else {
    sendCodeMessage(channel, 'No results found sorry');
  }
};

export const listCommand = (message: Message) => {
  const { channel } = message;
  const dbClient = getDbClient();

  dbClient.connect(async error => {
    if (error !== null) {
      console.error(error);
      return;
    }

    const userGameList = await getUserGameList(message, dbClient);
    if (userGameList.length === 0) {
      sendCodeMessage(channel, 'Your list is empty!');
      dbClient.close();
      return;
    }

    const gameListStr = formatGameList(userGameList);
    sendCodeMessage(channel, gameListStr, true);

    dbClient.close();
  });
};

export const rmCommand = (message: Message) => {
  const { channel, author } = message;
  const dbClient = getDbClient();

  dbClient.connect(async error => {
    if (error !== null) {
      console.error(error);
      return;
    }

    const userGameList = await getUserGameList(message, dbClient);
    if (userGameList.length === 0) {
      sendCodeMessage(channel, 'Your list is empty!');
      dbClient.close();
      return;
    }

    const gameListStr = formatGameList(userGameList);
    sendCodeMessage(channel, gameListStr, true);
    sendCodeMessage(
      channel,
      `Submit an index [1-${userGameList.length}] to remove the game from your list or 0 to cancel`,
    );

    const indexSelected = await collectIndexFromUser(
      message,
      userGameList.length,
    );
    if (indexSelected === -1) {
      sendCodeMessage(channel, 'Operation cancelled');
      return;
    }
    const gameSelected: GameEntry = userGameList[indexSelected];
    const users = dbClient.db('game-release-bot').collection('users');
    await users.updateOne(
      { userId: author.id },
      {
        $pull: {
          gameList: gameSelected.gameId,
        },
      },
    );
    sendCodeMessage(
      channel,
      `< ${gameSelected.name} > removed from your list`,
      true,
    );
    dbClient.close();
  });
};
