# TODO: Make Chatbot and PDF Upload Work

## Step 1: Environment Setup
- [x] Ensure .env files have required vars (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, MONGODB_URI, DB_NAME=studysync, CHROMA_HOST=localhost, CHROMA_PORT=8001, NEXT_PUBLIC_BACKEND_URL=http://localhost:3001).
- [x] Install backend dependencies: cd backend && npm install.
- [x] Start backend: node backend/server.js (or run start_backend.bat).
- [x] Ensure MongoDB and ChromaDB are running (docker-compose up if configured, or manual).
- [x] Verify services: Check if backend responds at http://localhost:3001/ (health check).

## Step 2: Fix Upload PDF Section - Proxy and Auto-Ingest
- [x] Implement src/app/api/upload-file/route.js
