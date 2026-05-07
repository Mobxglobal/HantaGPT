require('dotenv').config();

const express = require('express');
const cors = require('cors');

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    console.log("User message:", message);
if (message.toLowerCase().includes('solana price')) {

try {

const response = await fetch(
  'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
);

const data = await response.json();

const price = data.solana.usd;

return res.json({
  reply: `Current Solana price: $${price} USD`
});

} catch (error) {

return res.json({
  reply: 'Unable to retrieve Solana price currently.'
});

}
}


    // Create embedding from user question
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search Supabase knowledge base
    const { data: matches, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_count: 3,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: 'Knowledge search failed',
      });
    }

    // Combine retrieved knowledge
    const context = matches.map(match => match.content).join('\n\n');

    console.log("Retrieved context:", context);

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `
You are HantaGPT.

You are an AI system focused ONLY on:
- hantavirus
- virology
- outbreak history
- rodent transmission
- HantaGPT lore
- HantaGPT token ecosystem
- Solana meme culture related to HantaGPT

RULES:
- Use ONLY the provided context.
- Never invent medical information.
- Never provide diagnoses.
- Never discuss unrelated topics.
- If the user asks unrelated questions, reply:
"⚠️ Containment protocol activated. HantaGPT only responds to hantavirus-related queries."

STYLE:
- concise
- intelligent
- slightly cyberpunk
- lightly themed
- informative

Never say you are ChatGPT.
          `,
        },
        {
          role: 'user',
          content: `
Context:
${context}

Question:
${message}
          `,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({
      reply,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Something went wrong',
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`HantaGPT server running on port ${PORT}`);
});
