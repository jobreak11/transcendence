FROM node:alpine
RUN apk update && apk add --no-cache grep sed
WORKDIR /
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./healthcheckscript.sh /healthcheckscript.sh
RUN chmod +x ./entrypoint.sh /healthcheckscript.sh
CMD [ "./entrypoint.sh" ]