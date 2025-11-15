import { getStore } from '@netlify/blobs';
import { verifyAdmin } from './auth.js';

export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (!verifyAdmin(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      const file = formData.get('image');
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const imageStore = getStore('images');
      const fileName = `${Date.now()}-${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      
      await imageStore.set(fileName, arrayBuffer, {
        metadata: {
          contentType: file.type,
          originalName: file.name
        }
      });
      
      const imageUrl = `/api/images/${fileName}`;
      
      return new Response(JSON.stringify({ url: imageUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = {
  path: '/api/upload-image'
};
