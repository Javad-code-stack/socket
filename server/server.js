/* ---------------------------- IMPORT STATEMENTS --------------------------- */

import { Server } from "socket.io";

import express from "express";

import path from "path";
import { fileURLToPath } from "url";

/* ------------------------------ SERVER SETUP ------------------------------ */

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

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

// State
const UserState = {
	users: [],
	setUsers: function (newUsersArray) {
		this.users = newUsersArray;
	},
};

/* ------------------------------ SOCKET EVENTS ----------------------------- */

io.on("connection", (socket) => {
	const user = `user_${socket.id.substring(0, 5)}`;

	// Upon connection - only to user -- io.emit for all, socket.emit only to the user connected
	socket.emit("message", buildMsg(ADMIN, "welcome to Live Chat 🥳"));

	socket.on("enterRoom", ({ name, room }) => {
		// Leave previous room
		const prevRoom = getUser(socket.id)?.room;
		if (prevRoom) {
			socket.leave(prevRoom);
			io.to(prevRoom).emit("message", buildMsg(ADMIN, `${user} left the chat!`));
		}

		const user = activateUser(socket.id, name, room);
		if (prevRoom) {
			io.to(prevRoom).emit("userList", { users: getUsersInRoom(prevRoom) });
		}

		//
		socket.join(user.room);

		// To user who joined
		socket.emit("message", buildMsg(ADMIN, `You have joined the ${user.room}`));

		// To all other users
		socket.broadcast.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} has joined the room`));

		// Update user list for room
		io.to(user.room).emit("userList", {
			users: getUsersInRoom(user.room),
		});

		// Update active rooms list for all
		io.emit("roomList", {
			room: getAllActiveRooms(),
		});
	});

	// When user disconnect - to all
	socket.on("disconnect", () => {
		const user = getUser(socket.id);
		userLeavesApp(socket.id);

		if (user) {
			io.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} has left the room`));
			io.to(user.room).emit("userList", { users: getUsersInRoom(user.room) });
			io.emit("roomList", {
				room: getAllActiveRooms(),
			});
		}
	});

	// Listening for a message event
	socket.on("message", (name, text) => {
		const room = getUser(socket.id)?.room;
		if (room) {
			io.to(room).emit("message", buildMsg(name, text));
		}
	});

	// Listen for activity
	socket.on("activity", (name) => {
		const room = getUser(socket.id)?.room;
		if (room) {
			socket.broadcast.to(room).emit("activity", name);
		}
	});
});

function buildMsg(name, text) {
	return {
		name,
		text,
		time: new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
		}).format(new Date()),
	};
}

// user functions
function activateUser(id, name, room) {
	const user = { id, name, room };
	UserState.setUsers([...UserState.users.filter((user) => user.id !== id), user]);
	return user;
}

function userLeavesApp(id) {
	UserState.setUsers(UserState.users.filter((user) => user.id !== id));
}

function getUser(id) {
	return UserState.users.find((user) => user.id === id);
}

function getUsersInRoom(room) {
	return UserState.users.filter((user) => user.room === room);
}

function getAllActiveRooms() {
	return Array.from(new Set(UserState.users.map((user) => user.room)));
}
