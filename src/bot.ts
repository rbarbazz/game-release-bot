import { Client } from 'discord.js';

import { searchCommand } from './commands';

require('dotenv').config();
const client = new Client();
const prefix = '!';
export const apiUrl = 'https://api.rawg.io/api/games';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const { channel } = message;
  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'search') {
    searchCommand(args, channel);
  }
});

client.login(process.env.BOT_TOKEN);
