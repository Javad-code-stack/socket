import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 3000 });

server.on("connection", (socket) => {
	socket.on("message", (message) => {
		console.log(message);
		socket.send(`${message}`);
	});
});
