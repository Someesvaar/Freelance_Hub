import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="container mx-auto py-16 text-center px-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Find Your Next Big Opportunity</h1>
      <p className="text-xl text-gray-600 mb-8">
        The platform that connects talented freelancers with innovative clients.
      </p>
      <div className="space-x-4">
        <Link to="/projects" className="px-8 py-3 bg-indigo-600 text-white rounded-lg inline-block text-lg">
          Browse Projects
        </Link>
        <Link to="/post-project" className="px-8 py-3 border rounded-lg inline-block text-lg">
          Post a Job
        </Link>
      </div>
    </div>
  );
}
