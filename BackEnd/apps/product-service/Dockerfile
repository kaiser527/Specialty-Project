FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/product-service ./apps/product-service

EXPOSE 50051

CMD ["npm", "run", "dev:product"]