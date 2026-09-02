import { io } from "socket.io-client"

export const socket = io({
	path: "/nestjs/socket.io",
	autoConnect: false,
});
