# Game Release Bot

This Discord bot sends you a reminder on game releases.
Add a game to your list and the bot will message you the day it's out.

I haven't made that bot public yet but you can run your own instance. All you need is a Discord bot token and a Mongo database.
Declare the variables accordingly in a ```.env``` file:
```
BOT_TOKEN={Discord bot token}
DB_URL={Mongo connection string URI}
```

The cron job that updates the db and sends reminders is set to noon by default.

## Commands:
Search for a game ```!search [game]```

Add a game to your list ```!add [game]```

Show your list ```!list```

Remove an item from your list ```!rm```

Show the recap of all commands ```!help```
