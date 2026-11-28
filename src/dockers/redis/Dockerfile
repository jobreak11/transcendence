FROM redis:8.10.3-alpine
USER root
RUN apk add --no-cache sed grep shadow su-exec
RUN mkdir -p /app
COPY entrypoint.sh /app/entrypoint.sh
COPY redis.conf /usr/local/etc/redis/redis.conf
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]
