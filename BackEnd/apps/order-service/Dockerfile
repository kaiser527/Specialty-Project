FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/order-service ./apps/order-service

EXPOSE 50053

CMD ["npm", "run", "dev:order"]