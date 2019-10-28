import { Message, User } from 'discord.js';

export const sendCodeMessage = async (
  channel: Message['channel'] | User,
  message: string,
  md = false,
): Promise<Message | Message[]> => {
  try {
    return await channel.send(`\`\`\`${md ? 'md\n\n' : ''}${message}\`\`\``);
  } catch (error) {
    console.error(error);
  }
};

export const formatGameList = (list: BaseGameDetails[]) => {
  return list
    .map((item, index) => {
      const { released = '', tba, name } = item;
      const gameIndex = `${(index + 1).toString()}.`.padEnd(4, ' ');
      const gameTitle = `< ${name.slice(0, 28)}${
        name.length > 29 ? '…' : ''
      } >`.padEnd(34, ' ');
      return `${gameIndex}${gameTitle}<${tba ? 'TBA' : released}>`;
    })
    .join('\n');
};

export const sendGameList = (
  results: GameSearchResult[],
  channel: Message['channel'],
  add = false,
) => {
  const gameList = formatGameList(results);

  sendCodeMessage(channel, gameList, true);
  sendCodeMessage(
    channel,
    `Submit an index [1-${results.length}] ${
      add ? 'to add the game to your list' : 'to get more info about the game'
    } or 0 to cancel`,
  );
};
