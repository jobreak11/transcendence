FROM node:20-alpine

WORKDIR /app

# Copy package descriptors and install production dependencies
COPY package.json ./
RUN npm install --only=production

# Copy application source code
COPY . .

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
