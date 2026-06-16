const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/', (req, res) => res.send('FridgeSnap API is running!'));

app.post('/api/recipe', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the ingredients found in this fridge image and suggest 3 simple, creative recipes that can be made primarily with them. Format the response in clear Hebrew, with markdown formatting for recipe titles and bullet points for steps." },
            { type: "image_url", image_url: { url: image } }
          ],
        },
      ],
    });

    res.json({ recipe: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
