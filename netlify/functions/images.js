import { getStore } from '@netlify/blobs';

export default async (request, context) => {
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (!fileName) {
        return new Response(JSON.stringify({ error: 'Filename required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const imageStore = getStore('images');
      const blob = await imageStore.get(fileName, { type: 'arrayBuffer' });
      const metadata = await imageStore.getMetadata(fileName);
      
      if (!blob) {
        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': metadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000'
        }
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
  path: '/api/images/*'
};
