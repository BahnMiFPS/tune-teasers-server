function getQuestion(questionIndex) {
  // Assume you have an array of questions
  const quizQuestions = [
    {
      question: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Madrid"],
      correctAnswer: "Paris",
    },
    {
      question: "Who painted the Mona Lisa?",
      options: [
        "Leonardo da Vinci",
        "Vincent van Gogh",
        "Pablo Picasso",
        "Claude Monet",
      ],
      correctAnswer: "Leonardo da Vinci",
    },
    {
      question: "What is the largest planet in our solar system?",
      options: ["Jupiter", "Saturn", "Mars", "Earth"],
      correctAnswer: "Jupiter",
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Au", "Ag", "Fe", "Cu"],
      correctAnswer: "Au",
    },
    {
      question: "Who wrote the play Romeo and Juliet?",
      options: [
        "William Shakespeare",
        "Jane Austen",
        "Charles Dickens",
        "Mark Twain",
      ],
      correctAnswer: "William Shakespeare",
    },
  ];

  // Check if the question index is within the valid range
  if (questionIndex >= 0 && questionIndex < quizQuestions.length) {
    return quizQuestions[questionIndex];
  }

  return null; // Return null if the question index is invalid
}

module.exports = getQuestion;
