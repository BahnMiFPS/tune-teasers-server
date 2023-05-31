const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const getQuestion = require("./utils/getQuestion");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map(); // Map to store rooms and players

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("create_room", (data) => {
    const { name, roomId } = data;
    socket.join(roomId);
    const player = { id: socket.id, name, score: 0 };
    // Create a room object with players array, gameStarted flag, and currentQuestionIndex
    const room = {
      players: [player],
      gameStarted: false,
      currentQuestionIndex: 0,
    };
    rooms.set(roomId, room);

    io.in(roomId).emit("new_player_joined", { players: room.players });
  });

  socket.on("join_room", (data) => {
    const { name, roomId } = data;
    socket.join(roomId);
    // Create a new player object with a unique ID and score
    const player = { id: socket.id, name, score: 0 };

    // Get the room object from the rooms map
    const room = rooms.get(roomId);
    if (room) {
      // Check if the player already exists in the room
      const playerExists = room.players.some((p) => p.id === player.id);
      if (!playerExists) {
        room.players.push(player);
        io.in(roomId).emit("new_player_joined", { players: room.players });
      }
    }
  });
  socket.on("send_message", (data) => {
    io.in(data.roomId).emit("message_sent", data.message);
  });

  socket.on("start_game", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.gameStarted = true;
      room.currentQuestionIndex = 0;
    }
    io.in(roomId).emit("game_started", roomId);
  });

  socket.on("room_game_init", (roomId) => {
    const room = rooms.get(roomId);
    const players = room.players;
    const currentQuestion = getQuestion(room.currentQuestionIndex);
    io.in(roomId).emit("new_question", currentQuestion);
    io.in(roomId).emit("leaderboard_updated", players);
    room.currentQuestionIndex += 1;
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
