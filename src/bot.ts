import { Client } from 'discord.js';
import { MongoClient } from 'mongodb';
import * as schedule from 'node-schedule';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { searchCommand, addCommand, listCommand, rmCommand } from './commands';
import { sendCodeMessage } from './sendMessage';
import { updateReleaseDates, sendReminders } from './tasks';

dotenv.config({ path: path.join(__dirname, '../.env') });

export const discordClient = new Client();
export const prefix = '!';
export const getDbClient = () =>
  new MongoClient(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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
  } else if (command === 'rm') {
    rmCommand(message);
  } else if (command === 'list') {
    listCommand(message);
  } else if (command === 'help') {
    sendCodeMessage(
      message.channel,
      '!search [game]\n==============\nSearch for a game\n\n!add [game]\n===========\nAdd a game to your list\n\n!list\n=====\nShow your list\n\n!rm\n===\nRemove an item from your list\n\n!help\n=====\nShow this message',
      true,
    );
  } else {
    sendCodeMessage(message.channel, 'Wut?!');
  }
});

discordClient.login(process.env.BOT_TOKEN);

const dailytasks = schedule.scheduleJob('0 12 * * *', () => {
  updateReleaseDates();
  sendReminders();
});
