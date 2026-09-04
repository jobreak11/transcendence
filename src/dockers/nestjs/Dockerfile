FROM node:alpine
WORKDIR /app
RUN apk update && apk add --no-cache grep shadow sed su-exec python3 make g++
RUN npm install -g pnpm
COPY ./saves ./saves
COPY entrypoint.sh ./entrypoint.sh
COPY healthcheckscript.sh ./healthcheckscript.sh
RUN chmod +x ./entrypoint.sh ./healthcheckscript.sh
# RUN chmod -R 777 /home/node/app
# USER node
ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "npm", "run", "start:dev" ]
EXPOSE 3000
