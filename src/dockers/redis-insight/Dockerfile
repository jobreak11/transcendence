FROM node:alpine
ENV NODE_ENV=production
RUN npm install -g redis-commander
EXPOSE 8081
ENTRYPOINT ["redis-commander"]