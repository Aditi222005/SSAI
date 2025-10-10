// backend/src/api/materials/route.js

import clientPromise from "../../lib/mongodb.js";

export default () => async (req, res) => {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME);

      // Find all documents in the "materials" collection
      // We sort by uploadDate in descending order to show the newest first
      const materials = await db
        .collection("materials")
        .find({})
        .sort({ uploadDate: -1 })
        .toArray();

      return res.status(200).json(materials);

    } catch (error) {
      console.error("Failed to fetch materials:", error);
      return res.status(500).json({ error: "Failed to fetch materials" });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
