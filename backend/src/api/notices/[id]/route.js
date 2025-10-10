// backend/src/api/notices/[id]/route.js

import clientPromise from "../../../lib/mongodb.js";
import { ObjectId } from "mongodb";

export default () => async (req, res) => {
  const { id } = req.params;

  if (req.method === 'PUT') {
    try {
      const body = req.body;

      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME);

      // Build the update object from the request body
      const updateData = {};
      if (body.status) {
        updateData.status = body.status;
        if (body.status === 'published' && !body.publishDate) {
          updateData.publishDate = new Date();
        }
      }
      // Add other fields if they exist in the body
      if (body.title) updateData.title = body.title;
      if (body.content) updateData.content = body.content;
      if (body.category) updateData.category = body.category;
      if (body.priority) updateData.priority = body.priority;

      const result = await db.collection("notices").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Notice not found" });
      }

      const updatedNotice = await db.collection("notices").findOne({ _id: new ObjectId(id) });
      // Return the full, updated notice object
      return res.status(200).json({ success: true, notice: updatedNotice });

    } catch (error) {
      console.error("Update Notice Error:", error);
      return res.status(500).json({ error: "Failed to update notice" });
    }
  } else if (req.method === 'DELETE') {
    // Implement DELETE logic if needed
    res.status(405).json({ error: 'DELETE not implemented' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
