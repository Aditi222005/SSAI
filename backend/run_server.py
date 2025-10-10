import sys
import uvicorn
from chromadb.app import app

# This manually creates and runs the ChromaDB server application.
# It is a more robust way to start the server than the command line.

# NOTE: Before running for the first time, you may need to install uvicorn:
# pip install uvicorn

app = app

# If you get an error here, try running 'pip install uvicorn' in your terminal
uvicorn.run(app, host="0.0.0.0", port=8001)
