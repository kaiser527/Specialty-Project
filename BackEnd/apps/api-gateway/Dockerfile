FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy monorepo structure
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

EXPOSE 3069

CMD ["npm", "run", "dev:gateway"]