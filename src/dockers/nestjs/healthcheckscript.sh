#!/usr/bin/env sh

set -eu

node -e '
const net = require("node:net");
const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.exit(1);
}

const socket = net.createConnection({ host: "127.0.0.1", port });
socket.setTimeout(3000);
socket.once("connect", () => {
  socket.destroy();
  process.exit(0);
});
socket.once("error", () => process.exit(1));
socket.once("timeout", () => {
  socket.destroy();
  process.exit(1);
});
'
