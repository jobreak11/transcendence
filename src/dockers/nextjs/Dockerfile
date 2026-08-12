FROM node:alpine
RUN apk update && apk add --no-cache grep sed
WORKDIR /app
COPY --chown=node:node ./entrypoint.sh ./entrypoint.sh
COPY --chown=node:node ./healthcheckscript.sh ./healthcheckscript.sh
RUN chmod +x ./entrypoint.sh ./healthcheckscript.sh

USER node

CMD [ "./entrypoint.sh" ]