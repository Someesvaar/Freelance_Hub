import React, { useState } from 'react';

// Simple modal styling - you can replace this with a dedicated modal library
const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

function ReviewModal({ onSubmit, onClose, error }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      alert('Rating must be between 1 and 5');
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">Leave a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Rating (1-5)</label>
            <input
              type="number"
              className="form-input w-full"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              min="1"
              max="5"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Comment</label>
            <textarea
              className="form-input w-full"
              rows="5"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;