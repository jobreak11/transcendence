FROM nginx:alpine
COPY ./1-self-certificate-script.sh /docker-entrypoint.d/1-self-certificate-script.sh
COPY ./default.conf /etc/nginx/conf.d/default.conf
RUN apk update && apk add --no-cache openssl curl sed grep && chmod +x /docker-entrypoint.d/1-self-certificate-script.sh

