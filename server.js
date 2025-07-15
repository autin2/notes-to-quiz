const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


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
  const { notes, count } = req.body;

  console.log('Notes received:', notes);

  const prompt = `
Generate a JSON array with exactly ${count} multiple choice questions based on these notes.
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

app.post('/api/subject', async (req, res) => {
  const { notes } = req.body;

  const prompt = `
Read these notes and return a concise subject/topic name for them (e.g. "Organic Chemistry", "World History", "Calculus", etc.):

${notes}

Return only the subject as plain text.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    const subject = completion.choices[0].message.content.trim();
    res.json({ subject });
  } catch (e) {
    console.error('Subject detection error:', e);
    res.status(500).json({ error: 'Failed to detect subject.' });
  }
});


app.listen(3000, () => console.log('Server running on http://localhost:3000'));
