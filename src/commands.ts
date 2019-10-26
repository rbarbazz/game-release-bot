import { Message, User } from 'discord.js';

import { sendCodeMessage, sendGameList, formatGameList } from './sendMessage';
import { searchGames, getGameDetails } from './search';
import { getDbClient } from './bot';

const gamePrefixUrl = 'https://rawg.io/games/';
const selectGameFromList = async (
  message: Message,
  results: GameSearchResult[],
): Promise<GameDetail> => {
  const { channel, author } = message;
  const filter = (
    response: { content: string; author: User },
    author: User,
    results: GameSearchResult[],
  ) => {
    if (response.author.id !== author.id) return false;
    const responseInt = parseInt(response.content) - 1;

    return responseInt <= results.length && responseInt >= -1;
  };

  const collected = await channel.awaitMessages(
    response => filter(response, author, results),
    {
      maxMatches: 1,
      time: 30000,
      errors: ['time'],
    },
  );
  const collectedIndex = parseInt(collected.first().content) - 1;
  if (collectedIndex === -1) {
    sendCodeMessage(channel, 'Operation cancelled');
    return null;
  }

  const gameSelected = results[collectedIndex];
  return await getGameDetails(gameSelected.id);
};

export const searchCommand = async (args: string[], message: Message) => {
  const results = await searchGames(args.join(' '));
  const { channel } = message;

  if (results.length > 0) {
    sendGameList(results, channel);
    try {
      const gameDetails = await selectGameFromList(message, results);
      if (gameDetails === null) return;

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
      const gameDetails = await selectGameFromList(message, results);
      if (gameDetails === null) return;

      const dbClient = getDbClient();
      dbClient.connect(error => {
        if (error !== null) {
          console.error(error);
          return;
        }
        const users = dbClient.db('game-release-bot').collection('users');
        const games = dbClient.db('game-release-bot').collection('games');

        users.updateOne(
          { userId: author.id },
          {
            $addToSet: {
              gameList: gameDetails.id,
            },
          },
          { upsert: true },
        );
        games.updateOne(
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

export const listCommand = (args: string[], message: Message) => {
  const { channel, author } = message;
  const dbClient = getDbClient();

  dbClient.connect(async error => {
    if (error !== null) {
      console.error(error);
      return;
    }

    const users = dbClient.db('game-release-bot').collection('users');
    const games = dbClient.db('game-release-bot').collection('games');
    const currentUser: UserEntry = await users.findOne({ userId: author.id });
    if (currentUser === null) {
      sendCodeMessage(channel, "You don't have a list yet!");
      return;
    }

    let userGameList = await games
      .find({ gameId: { $in: currentUser.gameList } })
      .toArray();
    userGameList.sort(
      (a, b) =>
        a.tba ||
        new Date(a.released).getTime() - new Date(b.released).getTime(),
    );
    const gameListStr = formatGameList(userGameList);
    sendCodeMessage(channel, gameListStr, true);

    dbClient.close();
  });
};
