import { Message } from 'discord.js';

export const sendCodeMessage = async (
  channel: Message['channel'],
  message: string,
  md = false,
): Promise<Message | Message[]> => {
  try {
    return await channel.send(`\`\`\`${md ? 'md\n\n' : ''}${message}\`\`\``);
  } catch (error) {
    console.error(error);
  }
};

export const sendGameList = (
  results: SearchResult[],
  channel: Message['channel'],
  add = false,
) => {
  const gameList = results
    .map((result, index) => {
      const { released, tba } = result;
      const gameIndex = `${(index + 1).toString()}.`.padEnd(4, ' ');
      const gameTitle = `< ${result.name.slice(0, 29)}${
        result.name.length > 30 ? '…' : ''
      } >`.padEnd(35, ' ');
      return `${gameIndex}${gameTitle}<${tba ? 'TBA' : released}>`;
    })
    .join('\n');

  sendCodeMessage(channel, gameList, true);
  sendCodeMessage(
    channel,
    `Submit an index [1-${results.length}] ${
      add ? 'to add the game to your list' : 'to get more info about the game'
    } or 0 to cancel`,
  );
};
