import { createServer } from "http";
import { Server } from "socket.io";

const httserver = createServer();

const io = new Server(httserver, {
	cors: {
		origin:
			process.env.NODE_ENV === "production" ? false : ["http://localhost:*", "http://127.0.0.1:5500"],
	},
});

io.on("connection", (socket) => {
	const user = `user_${socket.id.substring(0, 5)}`;
	console.log(`${user} is connected.\n`);
	socket.on("message", (data) => {
		console.log(data);
		io.emit("message", `${user}:\t${data}`);
	});
});

httserver.listen(3500, () => {
	console.log("listening on 3500");
});
