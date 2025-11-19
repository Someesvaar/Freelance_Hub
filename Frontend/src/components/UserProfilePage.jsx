import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [freelancerImportName, setFreelancerImportName] = useState("");
  const [importStatus, setImportStatus] = useState(null);


  const isCurrentUser = currentUser?.id === parseInt(id, 10);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/user/${id}`);
      setProfile(res.data);
      setEditBio(res.data.bio || '');
      setEditSkills(res.data.skills || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/user/profile', { bio: editBio, skills: editSkills });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile.');
    }
  };

  if (loading) return <div className="container mx-auto py-8 px-4">Loading profile...</div>;
  if (error) return <div className="container mx-auto py-8 px-4 text-red-500">{error}</div>;
  if (!profile) return null;

  const skillsArray = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="card p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-lg text-indigo-600">{profile.is_freelancer ? 'Freelancer' : 'Client'}</p>
            {profile.is_freelancer && (
              <p className="text-2xl font-bold mt-2">
                Rating: {Number(profile.avg_rating || 0).toFixed(1)} / 5.0
              </p>
            )}
          </div>

          {isCurrentUser && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        <hr className="my-6" />

        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Bio</h3>
              <p className="text-gray-700">{profile.bio || 'No bio provided.'}</p>
            </div>

            {profile.is_freelancer && (
              <div>
                <h3 className="text-xl font-semibold">Skills</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillsArray.length > 0 ? (
                    skillsArray.map((skill, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-700">No skills listed.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                className="form-input w-full"
                rows="4"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>

            {profile.is_freelancer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditBio(profile.bio || '');
                  setEditSkills(profile.skills || '');
                }}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {!profile.is_freelancer && (
        <div className="card p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Posted Projects</h2>
          <div className="space-y-4">
            {profile.posted_projects && profile.posted_projects.length > 0 ? (
              profile.posted_projects.map((project) => (
                <div key={project.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <Link to={`/project/${project.id}`} className="text-lg font-semibold text-indigo-600 hover:underline">
                      {project.title}
                    </Link>
                    <p className="text-sm text-gray-600">Status: {project.status}</p>
                  </div>
                  <Link
                    to={`/project/${project.id}`}
                    className="px-3 py-1 border rounded bg-white hover:bg-gray-50 whitespace-nowrap transition-colors"
                  >
                    View Project & Bids
                  </Link>
                </div>
              ))
            ) : (
              <p>This client has not posted any projects yet.</p>
            )}
          </div>
        </div>
      )}

      {profile.is_freelancer && (
        
        <div className="card p-8 mt-8">
        {isCurrentUser && profile.is_freelancer && (
  <div className="card p-6 border rounded-lg mt-8">
    <h2 className="text-xl font-bold mb-4">Import Freelancer.com Rating</h2>

    <p className="text-gray-700 mb-4">
      Enter your Freelancer.com username to import your rating & review count.
    </p>

    <div className="flex gap-3 items-center">
      <input
        type="text"
        placeholder="Freelancer username"
        value={freelancerImportName}
        onChange={(e) => setFreelancerImportName(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />

      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={async () => {
          setImportStatus("Loading...");
          const { importFreelancerRating } = await import("../api/importFreelancer.js");
          const res = await importFreelancerRating(freelancerImportName.trim());

          if (!res.ok) {
            setImportStatus("❌ " + res.error);
            return;
          }

          const data = res.data;
          setImportStatus(
            `⭐ Rating: ${data.rating || "N/A"} | Reviews: ${data.reviews || "N/A"}`
          );

          // Update UI instantly
          if (data.rating) {
            setProfile((prev) => ({ ...prev, avg_rating: data.rating }));
          }
        }}
      >
        Import
      </button>
    </div>

    {importStatus && (
      <p className="mt-3 text-sm">
        {importStatus}
      </p>
    )}
  </div>
)}

          <h2 className="text-2xl font-bold mb-6">Accepted Projects</h2>
          <div className="space-y-4">
            {profile.accepted_projects && profile.accepted_projects.length > 0 ? (
              profile.accepted_projects.map((project) => (
                <div key={project.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <Link to={`/project/${project.id}`} className="text-lg font-semibold text-indigo-600 hover:underline">
                      {project.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Client: {project.client?.username || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Status: {project.status}</p>
                  </div>
                  <Link
                    to={`/project/${project.id}`}
                    className="px-3 py-1 border rounded bg-white hover:bg-gray-50 whitespace-nowrap transition-colors"
                  >
                    View Project
                  </Link>
                </div>
              ))
            ) : (
              <p>This freelancer has no accepted projects yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="card p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Reviews Received</h2>
        <div className="space-y-4">
          {profile.reviews_received && profile.reviews_received.length > 0 ? (
            profile.reviews_received.map((review) => (
              <div key={review.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{review.reviewer?.username || 'Anonymous'}</span>
                  <span className="text-lg font-bold text-yellow-500">{review.rating} / 5 ★</span>
                </div>
                <p className="mt-2 text-gray-700">{review.comment}</p>
              </div>
            ))
          ) : (
            <p>No reviews received yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
