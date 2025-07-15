// File: api/quiz.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { notes } = req.body;
  if (!notes) {
    res.status(400).json({ error: 'Missing notes in request body.' });
    return;
  }

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

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error('No content in OpenAI response');
      return res.status(500).json({ error: 'No content received from OpenAI.' });
    }

    let quiz;
    try {
      quiz = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Received content:', rawContent);
      return res.status(500).json({ error: 'Failed to parse quiz JSON.' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
}
