import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const { ChromaClient } = await import('chromadb');
const chroma = new ChromaClient({ host: process.env.CHROMA_HOST || "localhost", port: process.env.CHROMA_PORT || 8001 });

async function runCloudflareAI(model, inputs) {
  const AI_GATEWAY = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;
  const response = await fetch(`${AI_GATEWAY}/${model}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  const jsonResponse = await response.json();
  if (!jsonResponse.success) {
    console.error("Error from Cloudflare AI:", jsonResponse.errors);
    throw new Error(`Cloudflare AI API call failed: ${jsonResponse.errors?.[0]?.message || 'Unknown error'}`);
  }
  return jsonResponse;
}

const chatbotHandler = (await import('./src/api/chatbot/route.js')).default(chroma, runCloudflareAI);
const materialsHandler = (await import('./src/api/materials/route.js')).default();
const noticesHandler = (await import('./src/api/notices/route.js')).default();
const noticesIdHandler = (await import('./src/api/notices/[id]/route.js')).default();
const ingestHandler = (await import('./src/api/ingest/route.js')).default(chroma, runCloudflareAI);
const uploadFileHandler = (await import('./src/api/upload-file/route.js')).default(chroma);

app.post('/chatbot', chatbotHandler);
app.get('/materials', materialsHandler);
app.get('/notices', noticesHandler);
app.post('/notices', noticesHandler);
app.put('/notices/:id', noticesIdHandler);
app.post('/ingest', upload.single('file'), ingestHandler);
app.post('/upload-file', upload.single('file'), uploadFileHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
