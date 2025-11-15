import { getStore } from '@netlify/blobs';
import { verifyAdmin } from './auth.js';

export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const store = getStore('certificates');

  if (request.method === 'GET') {
    try {
      const certificatesData = await store.get('all', { type: 'json' });
      return new Response(JSON.stringify(certificatesData || []), {
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

  if (!verifyAdmin(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    try {
      const newCertificate = await request.json();
      const certificates = (await store.get('all', { type: 'json' })) || [];
      
      newCertificate.id = Date.now().toString();
      certificates.push(newCertificate);
      
      await store.setJSON('all', certificates);
      
      return new Response(JSON.stringify(newCertificate), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (request.method === 'PUT') {
    try {
      const updatedCertificate = await request.json();
      
      if (!updatedCertificate.id) {
        return new Response(JSON.stringify({ error: 'ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const certificates = (await store.get('all', { type: 'json' })) || [];
      const index = certificates.findIndex(c => c.id === updatedCertificate.id);
      
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Certificate not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      certificates[index] = updatedCertificate;
      await store.setJSON('all', certificates);
      
      return new Response(JSON.stringify(updatedCertificate), {
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

  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const certificates = (await store.get('all', { type: 'json' })) || [];
      const filteredCertificates = certificates.filter(c => c.id !== id);
      
      await store.setJSON('all', filteredCertificates);
      
      return new Response(JSON.stringify({ success: true }), {
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
  path: '/api/certificates'
};
