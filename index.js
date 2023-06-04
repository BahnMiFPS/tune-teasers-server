const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { getQuestion, generateRoomQuestions } = require("./utils/getQuestion");
const { getPlayListByCountry } = require("./utils/fetchPlaylist");
const { getAccessToken } = require("./utils/spotify");
const app = express();
const { faker } = require("@faker-js/faker");
app.use(cors());

const server = http.createServer(app);
const port = process.env.PORT || 3001;
const clientAppOrigin =
  process.env.NODE_ENV === "production"
    ? "https://tune-teaser.netlify.app"
    : "http://localhost:3000";
const io = new Server(server, {
  cors: {
    origin: clientAppOrigin,
    methods: ["GET", "POST"],
  },
});

// Access token variable to store the token
let accessToken = null;

// Get access token during server startup or when needed for the first time
(async () => {
  try {
    accessToken = await getAccessToken();
    console.log("Access token obtained successfully!");
  } catch (error) {
    console.error("Failed to obtain access token:", error);
    process.exit(1);
  }
})();

app.get("/", (req, res) => {
  res.send("Hello, this is Tune Teasers!");
});

app.get("/api/playlists", async (req, res) => {
  console.log("fetching playlists");
  const { country, locale } = req.query;
  try {
    const playlists = await getPlayListByCountry(country, locale, accessToken);
    const playlistData = playlists.playlists.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      image: playlist.images[0].url,
    }));
    res.json({ data: playlistData });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
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
    const randomImage = faker.image.urlLoremFlickr({ category: "cat" });
    const player = { id: socket.id, name, score: 0, image: randomImage };
    // Create a room object with players array, gameStarted flag, and currentQuestionIndex
    const room = {
      players: [player],
      gameStarted: false,
      currentQuestionIndex: 0,
      currentAnswers: 0,
      messages: [],
      questions: [],
    };
    rooms.set(roomId, room);

    io.in(roomId).emit("new_player_joined", { players: room.players });
  });

  socket.on("join_room", (data) => {
    const { name, roomId } = data;
    // Create a new player object with a unique ID and score
    const randomImage = faker.image.urlLoremFlickr({ category: "cat" });

    const player = { id: socket.id, name, score: 0, image: randomImage };

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
    const sender = room.players[senderIndex];

    const newMessage = {
      sender: socket.id,
      message,
      displayName: sender.name,
      photoURL: sender.image,
    };
    room.messages.push(newMessage);
    io.in(roomId).emit("message_sent", newMessage);
  });

  socket.on("picked_music_starting_game", async ({ roomId, playlistId }) => {
    io.in(roomId).emit("countdown_start", roomId);
    const room = rooms.get(roomId);
    if (room) {
      room.gameStarted = true;
      room.currentQuestionIndex = 0;
      room.questions = await generateRoomQuestions(playlistId);
    }
  });

  socket.on("start_game", ({ roomId }) => {
    io.in(roomId).emit("game_started", roomId);
  });

  socket.on("room_game_init", (roomId, playlist_id) => {
    const room = rooms.get(roomId);
    const players = room.players;
    const roomQuestions = room.questions;
    const currentQuestion = getQuestion(
      room.currentQuestionIndex,
      roomQuestions
    );
    io.in(roomId).emit("new_question", currentQuestion);
    io.in(roomId).emit("leaderboard_updated", players);
  });
  socket.on("pick_music", (roomId) => {
    io.in(roomId).emit("start_choosing_music", roomId);
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

  socket.on("chosen_answer", async ({ answerIndex, roomId }) => {
    const room = rooms.get(roomId);

    const currentQuestionIndex = room.currentQuestionIndex;
    const roomQuestions = room.questions;
    const question = getQuestion(room.currentQuestionIndex, roomQuestions);
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
      console.log(
        "🚀 ~ file: index.js:223 ~ socket.on ~ room.currentAnswers:",
        room.currentAnswers
      );
      const QUESTIONS_TO_ENDGAME = 4; // 5qs.
      room.currentQuestionIndex += 1;
      console.log(room.currentQuestionIndex);
      if (currentQuestionIndex === QUESTIONS_TO_ENDGAME) {
        setTimeout(() => {
          io.in(roomId).emit("game_ended", roomId);
        }, 2000);
      } else {
        var time = 5;
        var roundCountdown = setInterval(() => {
          if (time == 0) {
            io.sockets.in(roomId).emit("countdown", 0);
            const roomQuestions = room.questions;
            const currentQuestion = getQuestion(
              room.currentQuestionIndex,
              roomQuestions
            );
            io.in(roomId).emit("new_question", currentQuestion);
            room.currentAnswers = 0;
            clearInterval(roundCountdown);
          }
          io.sockets.in(roomId).emit("countdown", time);
          time -= 1;
        }, 1000);
      }
    }
  });
});
server.listen(port, () => {
  console.log("🚀 ~ file: index.js:232 ~ server.listen ~ port:", port);
  console.log(`SERVER IS RUNNING on port: ${port}`);
});
