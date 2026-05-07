require('dotenv').config();

console.log("Chunked upload script started");

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

function chunkText(text, chunkSize = 800, overlap = 200) {
const chunks = [];

let start = 0;

while (start < text.length) {
const end = start + chunkSize;

chunks.push(text.slice(start, end));

start += chunkSize - overlap;

}

return chunks;
}

async function uploadKnowledge() {
const files = fs.readdirSync(KNOWLEDGE_FOLDER);

console.log("Files found:", files);

for (const file of files) {
const filePath = path.join(KNOWLEDGE_FOLDER, file);

const content = fs.readFileSync(filePath, 'utf-8');

console.log(`Processing: ${file}`);

const chunks = chunkText(content);

console.log(`Created ${chunks.length} chunks`);

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];

  console.log(`Embedding chunk ${i + 1}/${chunks.length}`);

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunk,
  });

  const embedding = embeddingResponse.data[0].embedding;

  const { error } = await supabase
    .from('knowledge_base')
    .insert({
      content: chunk,
      metadata: {
        source: file,
        chunk: i + 1,
      },
      embedding,
    });

  if (error) {
    console.error(`Error uploading chunk ${i + 1}:`, error);
  } else {
    console.log(`Uploaded chunk ${i + 1}`);
  }
}

}

console.log('Chunked knowledge upload complete.');
}

uploadKnowledge();

