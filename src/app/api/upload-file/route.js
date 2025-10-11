import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if backend is deployed
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ 
        error: 'Backend not deployed. Please deploy the backend server or contact administrator.' 
      }, { status: 503 });
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('category', category);

    const response = await fetch(`${backendUrl}/upload-file`, {
      method: 'POST',
      body: backendFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    // Auto-ingest after successful upload
    const ingestResponse = await fetch(`${backendUrl}/ingest`, {
      method: 'POST',
      body: backendFormData,
    });

    const ingestResult = await ingestResponse.json();

    if (!ingestResponse.ok) {
      console.warn('Ingest failed after upload:', ingestResult);
      // Still return upload success, but log warning
    }

    // Return upload result, ingest is background
    return NextResponse.json({ ...result, ingested: ingestResponse.ok });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ error: 'Upload failed - backend connection issue' }, { status: 500 });
  }
}
