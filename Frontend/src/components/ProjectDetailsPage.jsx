import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; // <- uses src/api.js defaults
import { useAuth } from '../context/AuthContext';
import ReviewModal from './ReviewModal'; // --- Import the modal

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState(false);

  // --- [NEW] State for Ranking ---
  const [rankingPriority, setRankingPriority] = useState('balanced');
  const [rankedBids, setRankedBids] = useState([]);
  const [isRanking, setIsRanking] = useState(false);
  // --- [END NEW] ---

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/project/${id}`);
      setProject(res.data);
      if (res.data?.bids && Array.isArray(res.data.bids)) {
        setBids(res.data.bids);
        // setRankedBids(res.data.bids); // We'll let the effect handle this
      } else {
        // Fallback to fetch bids (your logic)
        try {
          const bidsRes = await axios.get(`/project/${id}/bids`);
          const bidsData = bidsRes.data?.bids || bidsRes.data || [];
          setBids(bidsData);
          // setRankedBids(bidsData); // We'll let the effect handle this
        } catch (e) {
          setBids([]);
          setRankedBids([]);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line
  }, [id]);
  
  // --- [NEW] Manual Rank Button Handler ---
  const handleRankBids = async () => {
    if (!project?.id) return; // Don't run if no project

    setIsRanking(true);
    try {
      const res = await axios.post('/rank_bids', {
        project_id: project.id,
        priority: rankingPriority, // Uses the state
      });
      setRankedBids(res.data.ranked_bids);
    } catch (err) {
      console.error('Failed to fetch ranked bids:', err);
      setError('Could not rank bids. Displaying default list.');
      setRankedBids(bids); // Fallback
    } finally {
      setIsRanking(false);
    }
  };
  
  // --- [MODIFIED] useEffect for Calling Rank API ---
  useEffect(() => {
    // This effect runs ONCE when the project and bids are first loaded
    // to populate the initial "balanced" ranking.
    if (project?.id && bids.length > 0) {
      handleRankBids();
    }
    // `handleRankBids` is not a dependency as it's stable,
    // and we only want this to run when the project/bids data first arrives.
    // eslint-disable-next-line
  }, [project?.id, bids]); 
  // --- [END NEW] ---

  // --- [No changes to your helper functions] ---
  const normalizeBidFreelancerId = (bid) => {
    if (bid?.freelancer?.id) return bid.freelancer.id;
    if (bid?.freelancer_id) return bid.freelancer_id;
    if (bid?.bidder_id) return bid.bidder_id;
    return null;
  };

  // This function is no longer used by the bid card, but
  // we can keep it in case the original `bids` array is ever used.
  const normalizeBidFreelancerName = (bid) => {
    if (bid?.freelancer?.username) return bid.freelancer.username;
    if (bid?.freelancer?.name) return bid.freelancer.name;
    if (bid?.bidder?.username) return bid.bidder.username;
    const id = normalizeBidFreelancerId(bid);
    return id ? `User #${id}` : 'Unknown';
  };

  const userHasBid = () => {
    if (!user) return false;
    return bids.some(b => normalizeBidFreelancerId(b) === user.id);
  };
  
  // --- [Your existing bid handlers - UNCHANGED] ---
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`/project/${id}/bid`, {
        amount: parseFloat(bidAmount),
        proposal: bidProposal,
      });
      setBidAmount('');
      setBidProposal('');
      await fetchProject();
    } catch (err) {
      console.error('Failed to place bid:', err);
      setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to place bid.');
    }
  };

  const handleAcceptBid = async (bidId) => {
    setError('');
    try {
      await axios.post(`/project/${id}/accept_bid`, { bid_id: bidId });
      await fetchProject();
    } catch (err) {
      console.error('Failed to accept bid:', err);
      setError(err.response?.data?.msg || err.response?.data?.error || 'Failed to accept bid.');
    }
  };

  // --- [NEW] Action Handlers for Workflow (UNCHANGED) ---
  const handleCompleteWork = async () => {
    setError('');
    try {
      await axios.post(`/project/${id}/complete`);
      await fetchProject(); // Refresh project to show new status
    } catch (err) {
      console.error('Failed to submit work:', err);
      setError(err.response?.data?.msg || 'Failed to submit work.');
    }
  };

  const handleRequestRevision = async () => {
    setError('');
    try {
      await axios.post(`/project/${id}/request_revision`);
      await fetchProject(); // Refresh project
    } catch (err) {
      console.error('Failed to request revision:', err);
      setError(err.response?.data?.msg || 'Failed to request revision.');
    }
  };

  const handleAcceptCompletedWork = async () => {
    setError('');
    try {
      await axios.post(`/project/${id}/accept`);
      await fetchProject(); // Refresh project, status will be 'completed'
    } catch (err) {
      console.error('Failed to accept work:', err);
      setError(err.response?.data?.msg || 'Failed to accept work.');
    }
  };

  const handlePostReview = async (rating, comment) => {
    setError('');
    try {
      await axios.post(`/project/${id}/review`, { rating, comment });
      setShowReviewModal(false);
      await fetchProject(); // Refresh project to show new review
    } catch (err) {
      console.error('Failed to post review:', err);
      setError(err.response?.data?.msg || 'Failed to post review.');
    }
  };

  // --- [NEW] Helper to check if user has already reviewed (UNCHANGED) ---
  const userHasReviewed = () => {
    if (!user || !project?.reviews) return false;
    return project.reviews.some(review => review.reviewer_id === user.id);
  }

  // --- Loading/Error/Null checks (UNCHANGED) ---
  if (loading) return <div className="container mx-auto py-8 px-4">Loading project details...</div>;
  if (error && !showReviewModal) return <div className="container mx-auto py-8 px-4 text-red-500">{error}</div>;
  if (!project) return null;

  const isClient = user && project?.client && user.id === project.client.id;
  
  const isAssignedFreelancer = user && (
    (project?.freelancer && user.id === project.freelancer.id) ||
    (project?.freelancer_id && user.id === project.freelancer_id)
  );
  
  const isFreelancer = user?.is_freelancer;
  const alreadyBid = userHasBid();

  // --- [NEW] Conditional Rendering for Action Panel (UNCHANGED) ---
  const renderActionPanel = () => {
    // ... (Your existing logic here is perfect) ...
    // --- Freelancer's View ---
    if (isAssignedFreelancer) {
      if (project.status === 'in_progress' || project.status === 'needs_revision') {
        return (
          <div className="text-center">
            <button onClick={handleCompleteWork} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold">
              Submit Work for Review
            </button>
            {project.status === 'needs_revision' && <p className="text-yellow-700 mt-2">The client has requested revisions.</p>}
          </div>
        );
      }
      if (project.status === 'pending_review') {
        return <p className="text-center font-semibold text-gray-700">Work submitted. Waiting for client approval.</p>;
      }
      if (project.status === 'completed' && !userHasReviewed()) {
        return (
          <div className="text-center">
            <p className="text-lg text-green-700 font-semibold mb-3">Project Completed!</p>
            <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-gray-600 text-white rounded">
              Review Client
            </button>
          </div>
        );
      }
    }

    // --- Client's View ---
    if (isClient) {
      if (project.status === 'pending_review') {
        return (
          <div className="text-center space-x-4">
            <p className="text-lg font-semibold mb-3">The freelancer has submitted work for your review.</p>
            <button onClick={handleAcceptCompletedWork} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold">
              Accept Work
            </button>
            <button onClick={handleRequestRevision} className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold">
              Request Revisions
            </button>
          </div>
        );
      }
      if (project.status === 'completed' && !userHasReviewed()) {
         return (
          <div className="text-center">
            <p className="text-lg text-green-700 font-semibold mb-3">You have accepted this work.</p>
            <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Review Freelancer
            </button>
          </div>
        );
      }
    }
    
    return null;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* --- Project Details Card (UNCHANGED) --- */}
      <div className="card p-8">
        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-4 ${
          project.status === 'open' ? 'bg-green-100 text-green-800' :
          project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          project.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
          project.status === 'needs_revision' ? 'bg-red-100 text-red-800' :
          project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>{project.status.replace('_', ' ')}</span>

        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
        <p className="text-gray-600 text-sm mb-4">Client: {project.client?.username || `User #${project.client?.id || 'N/A'}`}</p>
        <p className="text-2xl font-bold text-gray-900 mb-6">
          Budget: {project.budget != null ? `$${Number(project.budget).toLocaleString()}` : 'Not specified'}
        </p>
        <div className="prose max-w-none"><p>{project.description}</p></div>
      </div>

      {/* --- Action Panel (UNCHANGED) --- */}
      {project.status !== 'open' && (
        <div className="card p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Project Status</h2>
          {renderActionPanel()}
        </div>
      )}

      {/* --- Bid List --- [MODIFIED] --- */}
      <div className="card p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Bids ({bids.length})</h2>
        
       {/* --- [NEW] Ranking Buttons & Manual Rank Button --- */}
        {isClient && project.status === 'open' && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm font-semibold text-gray-600">Rank by:</span>
            
            {/* Priority Selection */}
            <select
              value={rankingPriority}
              onChange={(e) => setRankingPriority(e.target.value)}
              className="form-input py-1 px-3 rounded-lg bg-gray-100"
            >
              <option value="balanced">Balanced</option>
              <option value="price">Price</option>
              <option value="time">Time</option>
              <option value="ratings">Ratings</option>
            </select>
            
            {/* Manual Rank Button */}
            <button 
              onClick={handleRankBids} 
              className="px-4 py-1 bg-indigo-600 text-white rounded-lg font-semibold"
              disabled={isRanking}
            >
              {isRanking ? "Ranking..." : "Rank"}
            </button>
          </div>
        )}
        {/* --- [END NEW] --- */}
        {/* --- [END NEW] --- */}

        <div className="space-y-4">
          {isRanking ? <p className='text-center'>Ranking bids...</p> : (
            
            // --- [MODIFIED] Map over `rankedBids` ---
            rankedBids.length === 0 ? <p>No bids placed yet.</p> : rankedBids.map((bid, index) => {
              
              // --- [FIXED] Read from the flat `bid` object ---
              const bidderName = bid.freelancer_name; // Use bid.freelancer_name
              const bidAmount = bid.bid_amount;     // Use bid.bid_amount
              const proposal = bid.proposal;          // Use bid.proposal
              const bidId = bid.bid_id;             // Use bid.bid_id
              // --- [END FIX] ---

              return (
                <div key={bidId} className="border p-4 rounded-lg flex space-x-4 items-start">
                  
                  {/* --- Rank Number --- */}
                  <div className="shrink-0 w-10 text-center pt-1">
                    <span className="text-3xl font-bold text-gray-400">#{index + 1}</span>
                    {bid.score !== undefined && (
                      <span className="text-xs text-gray-500 block">
                        ({(bid.score * 100).toFixed(0)} pts)
                      </span>
                    )}
                  </div>
                  
                  <div className="grow">
                    <div className="flex justify-between items-center">
                      <div>
                        {/* --- [FIXED] --- */}
                        <p className="text-lg font-semibold">{bidderName}</p>
                        <p className="text-xl font-bold text-indigo-600">${Number(bidAmount).toLocaleString()}</p>
                      </div>
                      {isClient && project.status === 'open' && (
                        <button onClick={() => handleAcceptBid(bidId)} className="px-3 py-1 bg-indigo-600 text-white rounded">
                          Accept Bid
                        </button>
                      )}
                    </div>
                    {/* --- [FIXED] --- */}
                    <p className="mt-4 text-gray-700">{proposal}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* --- Place Bid Form (UNCHANGED) --- */}
      {isAuthenticated && isFreelancer && project.status === 'open' && !alreadyBid && (
        <div className="card p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Place Your Bid</h2>
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Your Bid Amount ($)</label>
              <input type="number" className="form-input w-full" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required min="1" step="0.01" />
            </div>
            <div>
              <label className="block text-sm mb-1">Proposal</label>
              <textarea className="form-input w-full" rows="5" value={bidProposal} onChange={e => setBidProposal(e.target.value)} required />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit Bid</button>
          </form>
        </div>
      )}

      {isAuthenticated && isFreelancer && alreadyBid && project.status === 'open' && (
        <p className="text-center mt-8 text-lg font-semibold text-gray-700">You have already placed a bid on this project.</p>
      )}
      
      {/* --- Review Modal (UNCHANGED) --- */}
      {showReviewModal && (
        <ReviewModal
          onSubmit={handlePostReview}
          onClose={() => setShowReviewModal(false)}
          error={error} // Pass the error to the modal
        />
      )}
    </div>
  );
}