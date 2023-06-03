const fs = require("fs");
const { getPlaylistTracks } = require("./fetchPlaylist");

async function generateQuizQuestions(playlistId) {
  const quizQuestions = [];
  const playlistData = await getPlaylistTracks(playlistId);

  const tracks = playlistData.tracks.items;

  tracks.forEach((track, index) => {
    if (track.track.preview_url) {
      const options = [track.track.name];
      const question = {
        question: `What is the name of this song?`,
        options: generateOptions(tracks, index, options),
        correctAnswer: track.track.name,
        trackId: track.track.id,
        preview_url: track.track.preview_url,
      };

      quizQuestions.push(question);
    }
  });

  return quizQuestions;
}

function generateOptions(tracks, currentIndex, correctOptions) {
  const options = [...correctOptions]; // Start with the correct option as the first element
  const MAX_OPTIONS = 4;

  while (options.length < MAX_OPTIONS) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const randomOption = tracks[randomIndex].track.name;
    if (randomIndex !== currentIndex && !options.includes(randomOption)) {
      options.push(randomOption);
    }
  }

  // Shuffle the options array to randomize the order
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

function getQuestion(questionIndex, quizQuestions) {
  // Assume you have an array of questions

  // Check if the question index is within the valid range
  if (questionIndex >= 0 && questionIndex < quizQuestions.length) {
    return quizQuestions[questionIndex];
  }

  return null; // Return null if the question index is invalid
}

async function generateQuizFile(playlistId) {
  try {
    const playlistData = await getPlaylistTracks(playlistId);
    if (!playlistData) {
      console.log("Error: Failed to fetch playlist data");
      return;
    }

    const quizQuestions = generateQuizQuestions(playlistData);

    const quizData = JSON.stringify(quizQuestions, null, 2);

    fs.writeFileSync("quiz.json", quizData);
    console.log("Quiz file generated successfully!");
  } catch (error) {
    console.log("Error generating quiz file:", error);
  }
}

async function generateRoomQuestions(playlistId) {
  console.log(
    "🚀 ~ file: getQuestion.js:79 ~ generateRoomQuestions ~ playlistId:",
    playlistId
  );
  const MAX_QUESTION_PER_ROOM = 5;

  // Generate quiz questions based on the playlistId
  const quizQuestions = await generateQuizQuestions(playlistId);

  // Perform the Fisher-Yates shuffle
  for (let i = quizQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizQuestions[i], quizQuestions[j]] = [quizQuestions[j], quizQuestions[i]];
  }

  // Take the first MAX_QUESTION_PER_ROOM questions from the shuffled array
  const roomQuestionsCollection = quizQuestions.slice(0, MAX_QUESTION_PER_ROOM);

  return roomQuestionsCollection;
}

module.exports = {
  getQuestion,
  generateRoomQuestions,
  generateQuizFile,
};
