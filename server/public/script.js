const socket = io("ws://localhost:3500");

/* -------------------------------- Top part -------------------------------- */

const joinForm = document.querySelector("#form-join");
const nameInput = document.querySelector("#nameInput");
const chatRoom = document.querySelector("#roomInput");
const joinBtn = document.querySelector("#join");
const userList = document.querySelector("#user-list");
const roomList = document.querySelector("#room-list");

/* -------------------------------- Messages -------------------------------- */

const chatDisplay = document.querySelector("#chatDisplay");

/* ------------------------------- Lower part ------------------------------- */

const form = document.querySelector("#msgForm");
const activity = document.querySelector("#activity-field");
const msgInput = document.querySelector("#msgInput");

/* -------------------------------- Functions ------------------------------- */
function sendMessage(e) {
	e.preventDefault();
	if (msgInput.value && chatRoom.value && nameInput.value) {
		socket.emit("message", nameInput.value, msgInput.value);
		msgInput.value = "";
	}
	msgInput.focus();
}

function enterRoom(e) {
	e.preventDefault();
	if (chatRoom.value && nameInput.value) {
		socket.emit("enterRoom", {
			name: nameInput.value,
			room: chatRoom.value,
		});
	}
}

/* --------------------------------- Events --------------------------------- */
joinForm.addEventListener("submit", enterRoom);

form.addEventListener("submit", sendMessage);

msgInput.addEventListener("keypress", () => {
	socket.emit("activity", nameInput.value);
});

// Listen for messages
socket.on("message", (data) => {
	activity.textContent = "";
	const { name, text, time } = data;
	const li = document.createElement("li");
	li.className = "post";

	if (name === nameInput.value) {
		li.className = "post post--right";
	}
	if (name !== nameInput.value && name !== "Admin") {
		li.className = "post post--left";
	}
	if (name !== "Admin") {
		li.innerHTML = `<div class="poset__header ${
			name === nameInput.value ? "post__header--user" : "post__header--reply"
		}">
			<span class="post__header--name">${name}</span>
			<span class="post__header--time">${time}</span>
		</div>
		<div class="post__text">${text}</div>
		`;
	} else {
		li.innerHTML = `<div class="post__text__admin">${text}</div>`;
	}
	chatDisplay.appendChild(li);
	chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

let activityTimer;
socket.on("activity", (name) => {
	activity.textContent = `${name} is typing ...`;

	// Clear after 1 sec
	clearTimeout(activityTimer);
	activityTimer = setTimeout(() => {
		activity.textContent = "";
	}, 1000);
});

socket.on("userList", ({ users }) => {
	showUsers(users);
});

socket.on("roomList", ({ rooms }) => {
	showRooms(rooms);
});

function showUsers(users) {
	userList.textContent = "";
	if (users) {
		userList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`;
		users.forEach((user, i) => {
			userList.textContent += ` ${user.name}`;
		});
	}
}

function showRooms(rooms) {
	roomList.textContent = "";
	if (rooms) {
		roomList.innerHTML = `<em>Active rooms:</em>`;
		rooms.forEach((room, i) => {
			roomList.textContent += ` ${room.name},`;
		});
	}
}
