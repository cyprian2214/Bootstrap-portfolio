import { getStore } from '@netlify/blobs';
import { verifyAdmin } from './auth.js';

export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const store = getStore('projects');

  if (request.method === 'GET') {
    try {
      const projectsData = await store.get('all', { type: 'json' });
      return new Response(JSON.stringify(projectsData || []), {
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
      const newProject = await request.json();
      const projects = (await store.get('all', { type: 'json' })) || [];
      
      newProject.id = Date.now().toString();
      projects.push(newProject);
      
      await store.setJSON('all', projects);
      
      return new Response(JSON.stringify(newProject), {
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
      const updatedProject = await request.json();
      
      if (!updatedProject.id) {
        return new Response(JSON.stringify({ error: 'ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const projects = (await store.get('all', { type: 'json' })) || [];
      const index = projects.findIndex(p => p.id === updatedProject.id);
      
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      projects[index] = updatedProject;
      await store.setJSON('all', projects);
      
      return new Response(JSON.stringify(updatedProject), {
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
      
      const projects = (await store.get('all', { type: 'json' })) || [];
      const filteredProjects = projects.filter(p => p.id !== id);
      
      await store.setJSON('all', filteredProjects);
      
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
  path: '/api/projects'
};
