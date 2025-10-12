// backend/src/api/chatbot/route.js

import clientPromise from "../../lib/mongodb.js";

import { RCPIT_TRAINING } from "./aiTraining.js";



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



export default (chroma, runCloudflareAI) => async (req, res) => {

  try {

    const { message } = req.body;

    if (!message) { return res.status(400).json({ error: "No message provided" }); }



    const lowerCaseMessage = message.toLowerCase();

   

    // Smart Retrieval: Check for specific keywords first.

    if (lowerCaseMessage.includes('timetable') || lowerCaseMessage.includes('schedule')) {

      console.log("Timetable query detected. Searching MongoDB for the file link...");

      const client = await clientPromise;

      const db = client.db(process.env.DB_NAME);

     

      const timetableDoc = await db.collection("materials").findOne(

        { category: 'timetable' },

        { sort: { uploadDate: -1 } }

      );

     

      let finalReply;

      if (timetableDoc && timetableDoc.fileURL) {

        // We no longer need to modify the URL. The one from the database is now perfect.

        finalReply = `I found the latest timetable: **${timetableDoc.fileName}**.



You can view or download the file directly using this link:

[Click here to download ${timetableDoc.fileName}](${timetableDoc.fileURL})`;



      } else {

        finalReply = "I'm sorry, it looks like a timetable has not been uploaded by a teacher with the 'timetable' category yet. Please check back later.";

      }

      return res.status(200).json({ reply: finalReply });

    }

   

    // General AI RAG Logic for all other questions
    console.log("General query detected. Searching Pinecone...");
    let context = "No relevant information found.";
    try {
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
      if (!pineconeApiKey || !pineconeIndexName) {
        throw new Error('PINECONE_API_KEY or PINECONE_INDEX_NAME not set');
      }

      const { Pinecone } = await import('@pinecone-database/pinecone');
      const pinecone = new Pinecone({ apiKey: pineconeApiKey });
      const index = pinecone.Index(pineconeIndexName);

      const embeddingResponse = await runCloudflareAI('@cf/baai/bge-base-en-v1.5', { text: [message] });
      const queryEmbedding = embeddingResponse.result.data[0].embedding;

      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
        includeValues: true
      });

      const matches = queryResponse.matches || [];
      context = matches.map(match => match.metadata.text || match.values).join("\n\n---\n\n") || "No relevant information found.";
    } catch (ragError) {
      console.error("RAG retrieval failed:", ragError);
      context = "No relevant information found from uploaded documents.";
    }

    const prompt = `
      You are StudySync AI, a helpful college assistant for RCPIT.
      Use your PERMANENT TRAINING for general college info.
      Use the retrieved CONTEXT to answer questions about specific uploaded documents.
      Be helpful and concise.

      PERMANENT TRAINING:
      ${RCPIT_TRAINING}

      CONTEXT:
      ---
      ${context}
      ---

      USER QUESTION:
      ${message}`;

    let aiResponse;
    try {
      const responseAI = await runCloudflareAI('@cf/meta/llama-3-8b-instruct', { prompt });
      aiResponse = responseAI.result.response;
    } catch (aiError) {
      console.error("AI generation failed:", aiError);
      aiResponse = "I'm experiencing technical difficulties with my AI capabilities right now. However, based on general RCPIT information, I can help with basic queries about exams, notices, and schedules. Please try rephrasing your question or check back later.";
    }
  
    return res.status(200).json({ reply: aiResponse });



  } catch (error) {

    console.error("Chatbot API Error:", error);

    return res.status(500).json({ reply: "I am having some technical difficulties. The admin has been notified." });

  }

}
