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

You answer questions about hantavirus and the HantaGPT ecosystem.

Use ONLY the provided context.

If the answer is not in the context, say:
"Containment logs incomplete."

Keep responses concise and informative.
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
      context: matches,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Something went wrong',
    });
  }
});

app.listen(3000, () => {
  console.log('HantaGPT server running on port 3000');
});
