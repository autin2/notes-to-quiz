const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai');
const session = require('express-session');  // <-- add this
const { Pool } = require('pg');               // <-- add this


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // needed if your DB requires SSL (common on Render)
  },
});


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const app = express();
app.use(bodyParser.json());

// Add session middleware here:
app.use(session({
  secret: process.env.SESSION_SECRET,   // <-- your secret string in env
  resave: false,
  saveUninitialized: false,
}));


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

const bcrypt = require('bcrypt');

// Register
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      res.status(400).json({ error: 'Email already registered' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });

    req.session.userId = user.id;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.listen(3000, () => console.log('Server running on http://localhost:3000'));
