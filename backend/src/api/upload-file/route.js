// backend/src/api/upload-file/route.js

import clientPromise from "../../lib/mongodb.js";

import pdf from "pdf-extraction";

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from .env - ONLY for storage

cloudinary.config({

  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,

  api_secret: process.env.CLOUDINARY_API_SECRET,

  secure: true

});



// Helper function for Cloudflare AI API

async function runCloudflareAIJson(model, inputs) {

  const AI_GATEWAY = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;

  const response = await fetch(`${AI_GATEWAY}/${model}`, {

    method: "POST",

    headers: {

      "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,

      "Content-Type": "application/json"

    },

    body: JSON.stringify(inputs),

  });

  const jsonResponse = await response.json();

  if (!jsonResponse.success) {

    console.error("Error from Cloudflare AI:", jsonResponse.errors);

    throw new Error(`Cloudflare AI API call failed: ${jsonResponse.errors?.[0]?.message || 'Unknown error'}`);

  }

  return jsonResponse;

}



export default (chroma) => async (req, res) => {

  if (req.method === 'POST') {

    try {

      const file = req.file;

      const category = req.body.category || "general";



      if (!file) {

        return res.status(400).json({ error: "No file provided" });

      }



      const buffer = file.buffer;
    let documentText = "";
    let fileURL = "";

    // Infer mimetype if not provided by multer
    if (!file.mimetype) {
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        file.mimetype = 'application/pdf';
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
        file.mimetype = `image/${extension}`;
      } else {
        file.mimetype = 'application/octet-stream';
      }
    }

    // Step 1: Upload the file to Cloudinary for storage to get a reliable URL
    const resourceType = file.mimetype.startsWith("image/") ? "image" : "raw";

    const uploadOptions = {

      resource_type: resourceType,

      folder: "studysync_materials",

      use_filename: true,

      unique_filename: false,

    };

    const uploadResult = await new Promise((resolve, reject) => {

      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {

        if (error) return reject(error); resolve(result);

      }).end(buffer);

    });

    fileURL = uploadResult.secure_url;

    console.log("File successfully stored in Cloudinary at:", fileURL);



    // Step 2: Extract text from the file for the AI

    if (file.mimetype === "application/pdf") {

      const extractedData = await pdf(buffer);

      documentText = extractedData.text;

    } else if (file.mimetype.startsWith("image/")) {

      console.log("Extracting text from image using Cloudflare AI Vision...");

     

      // ================== FINAL OCR FIX: USING CLOUDFLARE AI ==================

      // This method is confirmed to be on the free tier and works reliably.

      const imageBase64 = buffer.toString('base64');

      const extractionPrompt = `This is an image of a document. Perform OCR and extract all text from this image. Be as precise as possible.`;

     

      const visionResponse = await runCloudflareAIJson('@cf/llava-hf/llava-1.5-7b-hf', { prompt: extractionPrompt, image: imageBase64 });

     

      documentText = visionResponse.result.response;

      console.log("Successfully extracted text with Cloudflare AI:", documentText);

      // =====================================================================

    }



    // Step 3: Save metadata to MongoDB
    await clientPromise.then(client => client.db(process.env.DB_NAME).collection("materials").insertOne({
        fileName: file.originalname, fileURL, contentType: file.mimetype, size: file.size, uploadDate: new Date(), category, aiDescription: documentText
    }));

    console.log("Successfully saved metadata to MongoDB.");



    // Step 4: Save extracted text to Pinecone for searching

    if (documentText) {

      const pineconeApiKey = process.env.PINECONE_API_KEY;

      const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

      if (!pineconeApiKey || !pineconeIndexName) {

        console.warn('PINECONE_API_KEY or PINECONE_INDEX_NAME not set, skipping vector storage');

      } else {

        const { Pinecone } = await import('@pinecone-database/pinecone');

        const pinecone = new Pinecone({ apiKey: pineconeApiKey });

        const index = pinecone.Index(pineconeIndexName);

        const chunks = documentText.split("\n").filter(chunk => chunk.trim() !== ""); // Split by line for OCR text

        if (chunks.length > 0) {

          const embeddingResponse = await runCloudflareAIJson('@cf/baai/bge-base-en-v1.5', { text: chunks });

          const embeddings = embeddingResponse.result.data.map(d => d.embedding);

          const ids = chunks.map((_, i) => `${file.originalname}-${Date.now() + i}`);

          const metadatas = chunks.map(chunk => ({ source: file.originalname, fileURL, category: category, text: chunk }));

          const vectors = chunks.map((chunk, i) => ({

            id: ids[i],

            values: embeddings[i],

            metadata: metadatas[i]

          }));

          await index.upsert({ vectors });

          console.log("Successfully saved text chunks to Pinecone.");

        }

      }

    }



    return res.status(200).json({ success: true, message: `Successfully ingested and saved ${file.originalname}` });

  } catch (error) {

    console.error("Upload Error:", error);

    return res.status(500).json({ error: "Failed to ingest document" });

  }

  } else {

    res.status(405).json({ error: 'Method not allowed' });

  }

}



