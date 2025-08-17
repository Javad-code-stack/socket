/**
 * SUMMARY DOCSTRING
 * -----------------
 * This script sets up a real-time chat server using Node.js, HTTP, and Socket.IO.
 *
 ** Purpose:
 * - To enable multiple clients to connect and exchange messages instantly.
 * - Socket.IO requires an underlying transport mechanism (an HTTP server in this case) to upgrade to WebSockets.
 *
 ** Key Details:
 * - Uses Node’s built-in "http" module to create a base server. Socket.IO then layers WebSocket connections on top of it.
 * - A Socket.IO `Server` instance is attached to the HTTP server. This way, clients can connect via the same host/port.
 * - CORS rules are configured: in dev, we allow localhost origins, but in production we block them for safety.
 * - Each new connection is given a "user_xxxxx" label, derived from its unique socket ID.
 * - Messages received from one client are broadcast to all others.
 * - The server listens on port 3500.
 *
 ** Notes:
 * - You *must* have an HTTP server (or HTTPS in production) because Socket.IO needs an upgrade path for WebSockets.
 * - Alternatives: You could use Express, Fastify instead of the bare `http` module, and attach Socket.IO to them.
 *! - Pitfalls:
 *   - Forgetting to configure CORS properly will cause browsers to block requests.
 *   - IDs like `socket.id.substring(0, 5)` aren’t secure identifiers — don’t use them for authentication.
 */

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
	console.log(`Listening on port ${PORT}`);
});

//* Create a new Socket.IO server attached to the HTTP server.
// The second argument configures options, here mainly CORS (Cross-Origin Resource Sharing).
//? Why we do this:
// - By default, browsers block WebSocket requests from different origins.
// - In dev, we whitelist localhost (any port), so we can connect from `index.html` on VSCode live server, etc.
// - In production, we disable this (`false`) to avoid exposing the server to any random origin.
//? Alternatives:
// - You could explicitly whitelist your frontend domain, e.g. "https://mychatapp.com".
const io = new Server(expressServer, {
	cors: {
		origin:
			process.env.NODE_ENV === "production" ? false : ["http://localhost:*", "http://127.0.0.1:5500"],
	},
});

/* ------------------------------ SOCKET EVENTS ----------------------------- */

//* Listen for a new socket connection.
// Every time a client connects, this callback runs with a unique `socket` object.
//? Why:
// - This is where you define per-user logic (naming, joining rooms, handling disconnections, etc).
io.on("connection", (socket) => {
	// Assign a nickname to the user using their socket.id.
	// We only take the first 5 chars for brevity.
	const user = `user_${socket.id.substring(0, 5)}`;

	// Log the connection event on the server for monitoring.
	console.log(`${user} is connected.\n`);

	// Listen for "message" events from this client.
	// `data` can be any string the client sends.
	socket.on("message", (data) => {
		// Broadcast the message to ALL connected clients (including the sender).
		// Each message is prefixed with the user’s generated ID.
		// Alternatives:
		// - Use `socket.broadcast.emit(...)` if you want to send to everyone EXCEPT the sender.
		// - Use "rooms" to send only to specific groups of sockets.
		io.emit("message", `${user}:\t${data}`);
	});
});
