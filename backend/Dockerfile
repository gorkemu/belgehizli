# backend/Dockerfile 
FROM node:18-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --loglevel verbose
COPY . .
EXPOSE 8080
CMD [ "sh", "-c", "sleep 2 && npm start" ] 
