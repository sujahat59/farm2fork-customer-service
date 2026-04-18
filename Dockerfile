FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npx prisma migrate deploy

EXPOSE 3000

CMD ["node", "src/server.js"]
