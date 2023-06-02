const { generateQuizFile } = require("./getQuestion");

const dbGenerate = async () => {
  const playlist_id = "37i9dQZEVXbLdGSmz6xilI";
  await generateQuizFile(playlist_id); // Call the function with the desired playlist ID
};

const run = async () => {
  await dbGenerate();
};

run();
