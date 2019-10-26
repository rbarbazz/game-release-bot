import { Message, User } from 'discord.js';

import { sendCodeMessage, sendGameList } from './sendMessage';
import { searchGames, getGameDetails } from './search';
import { dbClient } from './bot';

const gamePrefixUrl = 'https://rawg.io/games/';
const filter = (
  response: { content: string; author: User },
  author: User,
  results: SearchResult[],
) => {
  if (response.author.id !== author.id) return false;
  const responseInt = parseInt(response.content) - 1;

  return responseInt <= results.length && responseInt >= -1;
};

export const searchCommand = async (args: string[], message: Message) => {
  const results = await searchGames(args.join(' '));
  const { channel, author } = message;

  if (results.length > 0) {
    sendGameList(results, channel);

    try {
      const collected = await channel.awaitMessages(
        response => filter(response, author, results),
        {
          maxMatches: 1,
          time: 30000,
          errors: ['time'],
        },
      );
      const collectedIndex = parseInt(collected.first().content) - 1;
      if (collectedIndex === -1) return;

      const gameSelected = results[collectedIndex];
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
      const collected = await channel.awaitMessages(
        response => filter(response, author, results),
        {
          maxMatches: 1,
          time: 30000,
          errors: ['time'],
        },
      );
      const gameSelected = results[parseInt(collected.first().content) - 1];
      const gameDetails = await getGameDetails(gameSelected.id);
      dbClient.connect(error => {
        if (error !== null) {
          console.error(error);
          return;
        }
        const userLists = dbClient
          .db('game-release-bot')
          .collection('userLists');
        userLists.updateOne(
          { userId: author.id },
          {
            $push: {
              gameList: {
                gameId: gameSelected.id,
                tba: gameSelected.tba,
              },
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
