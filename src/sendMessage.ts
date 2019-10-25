import { Message } from 'discord.js';

export const stripHtml = (str: string): string => {
  str = str.replace(/<p>/g, '');
  str = str.replace(/<\/p>/g, '\n');
  return str.replace(/<br \/>/g, '\n');
};

export const sendCodeMessage = async (
  channel: Message['channel'],
  message: string,
  md = false,
  files = {},
): Promise<Message | Message[]> => {
  return await channel.send(
    `\`\`\`${md ? 'md\n\n' : ''}${message}\`\`\``,
    files,
  );
};

export const sendGameList = (
  results: SearchResult[],
  channel: Message['channel'],
) => {
  const gameList = results
    .map((result, index) => {
      const gameIndex = `${(index + 1).toString()}.`.padEnd(4, ' ');
      const gameTitle = `< ${result.name.slice(0, 29)}${
        result.name.length > 30 ? '…' : ''
      } >`.padEnd(35, ' ');
      return `${gameIndex}${gameTitle}<${result.released}>`;
    })
    .join('\n');

  sendCodeMessage(channel, gameList, true);
  sendCodeMessage(
    channel,
    'Type an index [1-10] to get more info about the game',
  );
};
