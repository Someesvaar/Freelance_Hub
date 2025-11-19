import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <div className="card h-full flex flex-col">
      <div className="p-6 grow">
        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-2">Posted by {project.client?.username || 'Client'}</p>
        <p className="text-gray-800 font-bold text-lg mb-4">Budget: ${Number(project.budget).toLocaleString()}</p>
        <p className="text-gray-700 text-sm mb-4">{(project.description || '').substring(0, 100)}...</p>
      </div>
      <div className="p-6 bg-gray-50">
        <Link to={`/project/${project.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded w-full text-center block">
          View Details & Bid
        </Link>
      </div>
    </div>
  );
}
