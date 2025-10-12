import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json());

// Health check route for Render detection
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'StudySync Backend is running' });
});

const upload = multer({ storage: multer.memoryStorage() });

let chromaClient = null;
async function getChroma() {
  if (!chromaClient) {
    const { ChromaClient } = await import('chromadb');
    chromaClient = new ChromaClient({ host: process.env.CHROMA_HOST || "localhost", port: process.env.CHROMA_PORT || 8001 });
  }
  return chromaClient;
}

// Vectorize setup - no client needed, use API directly
const vectorizeIndexId = process.env.VECTORIZE_INDEX_ID;
if (!vectorizeIndexId) {
  console.warn('VECTORIZE_INDEX_ID not set - RAG will skip vector search');
}

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

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately in production to allow graceful shutdown
});

// Lazy-load chatbot handler
app.post('/chatbot', async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/chatbot/route.js');
    const chroma = await getChroma();
    const handler = makeHandler(chroma, runCloudflareAI);
    await handler(req, res);
  } catch (error) {
    console.error('Error loading chatbot handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lazy-load materials handler
app.get('/materials', async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/materials/route.js');
    const handler = makeHandler();
    await handler(req, res);
  } catch (error) {
    console.error('Error loading materials handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lazy-load notices handler (used for GET and POST)
app.get('/notices', async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/notices/route.js');
    const handler = makeHandler();
    await handler(req, res);
  } catch (error) {
    console.error('Error loading notices handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/notices', async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/notices/route.js');
    const handler = makeHandler();
    await handler(req, res);
  } catch (error) {
    console.error('Error loading notices handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lazy-load notices ID handler
app.put('/notices/:id', async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/notices/[id]/route.js');
    const handler = makeHandler();
    await handler(req, res);
  } catch (error) {
    console.error('Error loading notices ID handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lazy-load ingest handler
app.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/ingest/route.js');
    const chroma = await getChroma();
    const handler = makeHandler(chroma, runCloudflareAI);
    await handler(req, res);
  } catch (error) {
    console.error('Error loading ingest handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lazy-load upload-file handler
app.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    const { default: makeHandler } = await import('./src/api/upload-file/route.js');
    const chroma = await getChroma();
    const handler = makeHandler(chroma);
    await handler(req, res);
  } catch (error) {
    console.error('Error loading upload-file handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
