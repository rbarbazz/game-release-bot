import { Client } from 'discord.js';
import { MongoClient } from 'mongodb';

import { searchCommand, addCommand } from './commands';

require('dotenv').config();
const discordClient = new Client();
const prefix = '!';

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'search') {
    searchCommand(args, message);
  } else if (command === 'add') {
    addCommand(args, message);
  }
});

discordClient.login(process.env.BOT_TOKEN);

export const dbClient = new MongoClient(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
