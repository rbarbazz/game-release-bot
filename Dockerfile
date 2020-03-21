FROM node

EXPOSE 27017

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node . .

USER node

RUN npm i && npm run build

CMD ["npm", "start"]

# docker run --name game-release-bot -p 27017:27017 -v /absolute/path/to/.env:/home/node/app/.env --restart unless-stopped -d rbarbazz/game-release-bot:latest
