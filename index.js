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
  function findRoomIdBySocketId(socketId) {
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(
        (player) => player.id === socketId
      );
      if (playerIndex !== -1) {
        return roomId;
      }
    }
    return null; // Socket ID not found in any room
  }

  console.log(`User Connected: ${socket.id}`);
  socket.on("create_room", (data) => {
    const { name, roomId } = data;
    console.log(roomId);
    socket.join(parseInt(roomId));
    const player = { id: socket.id, name, score: 0 };
    // Create a room object with players array, gameStarted flag, and currentQuestionIndex
    const room = {
      players: [player],
      gameStarted: false,
      currentQuestionIndex: 0,
      currentAnswers: 0,
      messages: [],
    };
    rooms.set(roomId, room);

    io.in(roomId).emit("new_player_joined", { players: room.players });
  });

  socket.on("join_room", (data) => {
    const { name, roomId } = data;
    // Create a new player object with a unique ID and score
    const player = { id: socket.id, name, score: 0 };

    // Get the room object from the rooms map
    const room = rooms.get(parseInt(roomId));
    // if (!room) {
    //   console.log("!room", room);
    //   socket.emit("no_room_found", { player, roomId });
    // }
    if (room) {
      if (room.gameStarted) {
        socket.emit("no_room_found", { player, roomId });
      } else {
        socket.join(roomId);
        const playerExists = room.players.some((p) => p.id === player.id);
        // Check if the player already exists in the room
        if (!playerExists) {
          room.players.push(player);
          io.in(roomId).emit("new_player_joined", { players: room.players });
        }
      }
    }
  });
  socket.on("send_message", (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    const senderIndex = room.players.findIndex(
      (player) => player.id === socket.id
    );
    const senderName = room.players[senderIndex].name;

    const newMessage = {
      sender: socket.id,
      message,
      displayName: senderName,
      photoURL: "", // Add the sender's photoURL if available
    };
    room.messages.push(newMessage);
    io.in(roomId).emit("message_sent", newMessage);
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
  });

  socket.on("leave_room", (roomId) => {
    const room = rooms.get(roomId);
    const playerIndex = room.players.findIndex(
      (player) => player.id === socket.id
    );
    room.players.splice(playerIndex, 1);
    io.in(roomId).emit("leaderboard_updated", room.players);
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    // Handle disconnection
    const roomId = findRoomIdBySocketId(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      const playerIndex = room.players.findIndex(
        (player) => player.id === socket.id
      );
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.in(roomId).emit("leaderboard_updated", room.players);
      }
    }
  });

  socket.on("disconnect", function () {
    console.log("disconnected event");
  });

  socket.on("chosen_answer", ({ answerIndex, roomId }) => {
    const room = rooms.get(roomId);

    const currentQuestionIndex = room.currentQuestionIndex;
    const question = getQuestion(currentQuestionIndex);
    const isCorrect = question.options[answerIndex] === question.correctAnswer;
    const playerIndex = room.players.findIndex(
      (player) => player.id === socket.id
    );
    room.currentAnswers += 1;
    if (isCorrect) {
      if (room.currentAnswers === 1) {
        room.players[playerIndex].score += 2;
      } else {
        room.players[playerIndex].score += 1;
      }
      socket.emit("correct_answer", answerIndex);
      io.in(roomId).emit("leaderboard_updated", room.players);
    } else {
      socket.emit("wrong_answer");
    }

    if (room.currentAnswers === 1) {
      room.currentQuestionIndex += 1;
      if (currentQuestionIndex === 1) {
        setTimeout(() => {
          io.in(roomId).emit("game_ended", roomId);
        }, 2000);
      } else {
        const currentQuestion = getQuestion(room.currentQuestionIndex);
        setTimeout(() => {
          io.in(roomId).emit("new_question", currentQuestion);
          room.currentAnswers = 0;
        }, 3000);
      }
    }
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
