FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

# 确保上传目录存在
RUN mkdir -p /app/public/uploads /app/data

EXPOSE 3000

CMD ["node", "server.js"]
