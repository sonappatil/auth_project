FROM node:18.18.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000
# CMD ["node", "index.js"]
# CMD ["npm", "run", "dev"]
# CMD ["nodemon", "index.js"]

CMD ["npm", "start"]

