const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    socket.emit("user_info", socket.id);
  });
  socket.on("create_room", (data) => {
    console.log("🚀 ~ file: index.js:30 ~ socket.on ~ data:", data);

    socket.in(data.roomId).emit("room_owner", data);
  });
  socket.on("send_message", (data) => {
    socket.in(data.roomId).emit("message_sent", data.message);
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
