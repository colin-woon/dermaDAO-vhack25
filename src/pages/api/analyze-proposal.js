import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze the following charity proposal and give it a score from 0 to 100 
      based on these criteria:
      - Clear objectives and impact (30 points)
      - Financial transparency and budget details (30 points)
      - Implementation plan and timeline (20 points)
      - Sustainability and long-term impact (20 points)
      - Bonus: Realistic account numbers and figures (+10 points)

      Proposal text:
      ${text}

      Return only a number between 0 and 100.
      Justify why it received that score.
    `;

    const result = await model.generateContent(prompt);
    console.log('Gemini response:', result.response.text());
    const response = await result.response;
    const score = parseInt(response.text().trim());

    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error('Invalid score received from Gemini');
    }

    res.status(200).json({ score });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing proposal',
      error: error.message 
    });
  }
}