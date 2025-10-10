// backend/src/api/ingest/route.js

import pdf from "pdf-extraction";

export default (chroma, runCloudflareAI) => async (req, res) => {
  if (req.method === 'POST') {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // --- 1. Load and Parse Document using the new library ---
      const buffer = file.buffer;

      const extractedData = await pdf(buffer);
      const documentText = extractedData.text;

      // --- 2. Get or Create Chroma Collection ---
      const collection = await chroma.getOrCreateCollection({
        name: "studysync_materials",
        metadata: { "hnsw:space": "cosine" },
      });

      // --- 3. Split Text and Generate Embeddings ---
      const chunks = documentText.split("\n\n").filter(chunk => chunk.trim() !== "");
      let idCounter = Date.now();

      for (const chunk of chunks) {
        const embeddingResponse = await runCloudflareAI('@cf/baai/bge-base-en-v1.5', { text: [chunk] });
        const embedding = embeddingResponse.result.data[0];

        // --- 4. Store in Chroma DB ---
        await collection.add({
          ids: [`${file.originalname}-${idCounter++}`],
          embeddings: [embedding],
          metadatas: [{ source: file.originalname, content: chunk }],
          documents: [chunk],
        });
      }

      return res.status(200).json({ success: true, message: `Successfully ingested ${file.originalname}` });

    } catch (error) {
      console.error("Ingestion Error:", error);
      return res.status(500).json({ error: "Failed to ingest document" });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
