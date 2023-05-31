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
    console.log("joining");
    socket.join(data);
    socket.emit("user_info", socket.id);
  });

  socket.on("create_room", (data) => {
    console.log("creating");
    socket.join(data.roomId);

    io.in(data.roomId).emit("room_owner", {
      name: data.name,
      roomId: data.roomId,
      _id: socket.id,
    });
  });

  socket.on("send_message", (data) => {
    socket.in(data.roomId).emit("message_sent", data.message);
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
