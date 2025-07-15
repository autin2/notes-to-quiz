import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notes } = req.body;
  if (!notes) {
    return res.status(400).json({ error: 'Notes required' });
  }

  const prompt = `
Generate a JSON array with exactly 5 multiple choice questions based on these notes.
Each question must have:

"question": string

"choices": array of 4 strings

"answer": string (one of the choices)

Return only valid JSON, nothing else.

NOTES:
${notes}
`;

 try {
   const completion = await openai.chat.completions.create({
     model: 'gpt-4',
     messages: [{ role: 'user', content: prompt }],
   });

   const quiz = JSON.parse(completion.choices[0].message.content);

   // Shuffle choices
   quiz.forEach(q => {
     q.choices = q.choices.sort(() => Math.random() - 0.5);
   });

   return res.status(200).json({ quiz });
 } catch (e) {
   console.error(e);
   return res.status(500).json({ error: 'Failed to generate quiz.' });
 }

