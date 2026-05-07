require('dotenv').config();

console.log("Script started");

const fs = require('fs');
const path = require('path');

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const KNOWLEDGE_FOLDER = './hantagpt-knowledge';

async function uploadKnowledge() {
  const files = fs.readdirSync(KNOWLEDGE_FOLDER);

  console.log("Files found:", files);

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_FOLDER, file);

    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`Processing: ${file}`);

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    console.log("Embedding created");

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        content,
        metadata: {
          source: file,
        },
        embedding,
      });

    if (error) {
      console.error(`Error uploading ${file}:`, error);
    } else {
      console.log(`Uploaded: ${file}`);
    }
  }

  console.log('Knowledge upload complete.');
}

uploadKnowledge();
