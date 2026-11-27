FROM node:alpine3.24
ENV NODE_ENV=production
RUN npm install -g redis-commander@0.9.0
EXPOSE 8081
ENTRYPOINT ["redis-commander"]