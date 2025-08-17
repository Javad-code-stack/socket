const socket = io("ws://localhost:3500");

const input = document.querySelector("input");
const form = document.querySelector("form");
const list = document.querySelector("ul");

function sendMessage(e) {
	e.preventDefault();
	const input = document.querySelector("input");
	if (input.value) {
		socket.emit("message", input.value);
		input.value = "";
	}
	input.focus();
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
	const li = document.createElement("li");
	li.textContent = data;
	list.appendChild(li);

	window.scrollTo(0, document.body.scrollHeight);
});
