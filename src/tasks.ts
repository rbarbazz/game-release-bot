import { getDbClient, discordClient } from './bot';
import { getGameDetails } from './search';
import { sendCodeMessage } from './sendMessage';

export const updateReleaseDates = () => {
  const dbClient = getDbClient();

  dbClient.connect(async error => {
    if (error !== null) {
      console.error(error);
      return;
    }

    const games = dbClient.db('game-release-bot').collection('games');
    const allGames: GameEntry[] = await games.find().toArray();

    allGames.forEach(async game => {
      try {
        const gameDetails = await getGameDetails(game.gameId);
        games.updateOne(
          { gameId: gameDetails.id },
          gameDetails.tba
            ? {
                $set: {
                  tba: gameDetails.tba,
                },
              }
            : {
                $set: {
                  released: gameDetails.released,
                  tba: gameDetails.tba,
                },
              },
        );
      } catch (error) {
        console.error(error);
      }
    });

    dbClient.close();
  });
};

export const sendReminders = () => {
  const dbClient = getDbClient();

  dbClient.connect(async error => {
    if (error !== null) {
      console.error(error);
      return;
    }

    const users = dbClient.db('game-release-bot').collection('users');
    const games = dbClient.db('game-release-bot').collection('games');
    try {
      const allUsers: UserEntry[] = await users
        .find({ gameList: { $not: { $size: 0 } } })
        .toArray();

      allUsers.forEach(user => {
        user.gameList.forEach(async gameId => {
          const gameEntry: GameEntry = await games.findOne({ gameId });

          if (!gameEntry.tba) {
            const gameReleaseDate = new Date(gameEntry.released);
            const today = new Date();

            if (gameReleaseDate.toDateString() === today.toDateString()) {
              const userObject = await discordClient.fetchUser(user.userId);

              sendCodeMessage(
                userObject,
                `🎮 ${gameEntry.name} is out today! 🎮`,
              );
            }
          }
        });
      });
    } catch (error) {
      console.error(error);
    }

    dbClient.close();
  });
};
