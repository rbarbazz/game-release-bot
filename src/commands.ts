import { Message } from 'discord.js';

import { sendCodeMessage, sendGameList, stripHtml } from './sendMessage';
import { searchGames, getGameDetails } from './search';

export const searchCommand = async (
  args: string[],
  channel: Message['channel'],
) => {
  const results = await searchGames(args.join(' '));

  if (results.length > 0) {
    sendGameList(results, channel);

    const filter = (response: { content: string }) => {
      const responseInt = parseInt(response.content) - 1;

      return responseInt <= results.length && responseInt >= 0;
    };
    const collected = await channel.awaitMessages(filter, {
      maxMatches: 1,
      time: 30000,
      errors: ['time'],
    });
    const gameSelected = results[parseInt(collected.first().content) - 1];
    console.log(gameSelected);
    const gameDetails = await getGameDetails(gameSelected.id);
    sendCodeMessage(
      channel,
      `# ${gameDetails.name}\n\n${stripHtml(gameDetails.description)}`,
      true,
      { files: [gameDetails.background_image] },
    );
  } else {
    sendCodeMessage(channel, 'No results found sorry');
  }
};
