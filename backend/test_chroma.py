# test_chroma.py
try:
    import chromadb
    print("Successfully imported chromadb.")

    # This creates a temporary in-memory database client
    client = chromadb.Client()
    print("Successfully created a ChromaDB client.")

    print("\nChromaDB test PASSED!")

except Exception as e:
    print("\nChromaDB test FAILED.")
    print(f"Error: {e}")