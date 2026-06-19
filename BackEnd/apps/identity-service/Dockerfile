FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/identity-service ./apps/identity-service

EXPOSE 50052

CMD ["npm", "run", "dev:identity"]