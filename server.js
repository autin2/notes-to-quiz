const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: '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' });

const app = express();
app.use(bodyParser.json());

// Serve index.html on root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Shuffle helper function
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shuffle choices of each question
function shuffleChoices(quiz) {
  return quiz.map(q => {
    const shuffledChoices = shuffleArray([...q.choices]);
    return {
      question: q.question,
      choices: shuffledChoices,
      answer: q.answer, // answer is text, so no change needed
    };
  });
}

app.post('/api/quiz', async (req, res) => {
  const { notes } = req.body;
  console.log('Notes received:', notes);

  const prompt = `
Generate a JSON array with exactly 5 multiple choice questions based on these notes.
Each question must have:
- "question": string
- "choices": array of 4 strings
- "answer": string (one of the choices)

Return only valid JSON, nothing else.

NOTES:
${notes}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    console.log('OpenAI raw response:', completion.choices[0].message.content);

    const quiz = JSON.parse(completion.choices[0].message.content);
    const shuffledQuiz = shuffleChoices(quiz);

    res.json({ quiz: shuffledQuiz });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
