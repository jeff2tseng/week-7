FROM node:16

WORKDIR .

COPY . .

RUN npm i

EXPOSE 8080

CMD ["node", "index.js"]