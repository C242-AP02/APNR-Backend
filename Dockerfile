FROM node:20
RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN curl -o credentials.json https://google-drive-storage.zhongxina.workers.dev/Temp/submission/credentials.json
EXPOSE 9000
CMD ["npm", "run", "start"]