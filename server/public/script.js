const socket = io("ws://localhost:3500");

const msgInput = document.querySelector("#msgInput");
const form = document.querySelector("#msgForm");
const connectForm = document.querySelector("#form-join");
const list = document.querySelector("#msgList");
const activity = document.querySelector("#activity-field");

function sendMessage(e) {
	e.preventDefault();
	if (msgInput.value) {
		socket.emit("message", msgInput.value);
		msgInput.value = "";
	}
	msgInput.focus();
}

/*
    When you use sendMessage (without parentheses) in the event listener,
    you're passing a reference to the function, not executing it immediately.
    This is how event listeners work in JavaScript.

    If you used sendMessage() (with parentheses),
    the function would execute immediately when this line runs
    , rather than when the form is submitted.
 */

form.addEventListener("submit", sendMessage);

// Listen for messages
socket.on("message", (data) => {
	activity.textContent = "";
	const li = document.createElement("li");
	li.textContent = data;
	list.appendChild(li);

	window.scrollTo(0, document.body.scrollHeight);
});

msgInput.addEventListener("keypress", () => {
	socket.emit("activity", socket.id.substring(0, 5));
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
