/* ---------------------------- IMPORT STATEMENTS --------------------------- */

import { Server } from "socket.io";

import express from "express";

import path from "path";
import { fileURLToPath } from "url";

/* ------------------------------ SERVER SETUP ------------------------------ */

const PORT = process.env.PORT || 3500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}\nopen: http://localhost:3500/`);
});

const io = new Server(expressServer, {
	cors: {
		origin:
			process.env.NODE_ENV === "production"
				? false
				: ["http://localhost:5500", "http://127.0.0.1:5500"],
	},
});

/* ------------------------------ SOCKET EVENTS ----------------------------- */

io.on("connection", (socket) => {
	const user = `user_${socket.id.substring(0, 5)}`;

	console.log(`${user} is connected.\n`);

	// Upon connection - only to user -- io.emit for all socket.emit only to the user connected
	socket.emit("message", "welcome to Live Chat");

	// Goes to everyone except the user connected
	socket.broadcast.emit("message", `${user} is ready to talk!`);

	// Listening for a message event
	socket.on("message", (data) => {
		io.emit("message", `${user}:\t${data}`);
	});

	// When user disconnect - to all
	socket.on("disconnect", () => {
		socket.broadcast.emit("message", `${user} is offline.`);
	});

	// Listen for activity
	socket.on("activity", (name) => {
		socket.broadcast.emit("activity", name);
	});
});
