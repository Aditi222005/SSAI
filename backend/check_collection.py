import chromadb

client = chromadb.HttpClient(host="localhost", port=8001)

try:
    collection = client.get_collection(name="studysync_materials")
    print("Collection exists.")
    count = collection.count()
    print(f"Number of documents: {count}")
    if count > 0:
        results = collection.peek(limit=1)
        print("Sample document:", results['documents'][0][:200] + "...")
except Exception as e:
    print(f"Error: {e}")
