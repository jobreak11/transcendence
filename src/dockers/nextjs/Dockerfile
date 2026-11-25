FROM node:alpine3.24
RUN apk update && apk add --no-cache grep sed shadow su-exec
RUN npm install -g pnpm
WORKDIR /app
# && chmod -R 777 /home/node/app
COPY ./saves ./saves
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml
COPY ./package.json ./package.json
COPY ./healthcheckscript.sh ./healthcheckscript.sh
RUN chmod +x ./entrypoint.sh ./healthcheckscript.sh
# RUN chmod -R 777 /home/node/app
# USER node

ENTRYPOINT [ "./entrypoint.sh" ]
# CMD [ "npm", "run", "dev" ]
# CMD [ "npm", "run", "start" ]
