import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';

// ----------------------------------------------------------------------------
// NPOINT API INTEGRATION
// Replace this with your actual npoint JSON bin URL
// It should return an array of review objects: [{ id, name, rating, text, date, helpful }]
// ----------------------------------------------------------------------------
// API Endpoint
const API_URL = '/api/reviews'; 

let REVIEWS_CACHE = null;
let REVIEWS_CACHE_TIME = 0;
const REVIEWS_CACHE_TTL = 10 * 60 * 1000; // 10 mins

export default function ReviewsScreen() {
  const { state, dispatch } = useApp();
  const isCacheFresh = REVIEWS_CACHE && (Date.now() - REVIEWS_CACHE_TIME < REVIEWS_CACHE_TTL);
  const [reviews, setReviews] = useState(isCacheFresh ? REVIEWS_CACHE : []);
  const [isLoading, setIsLoading] = useState(!isCacheFresh);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [hoverAccuracy, setHoverAccuracy] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [hoverEase, setHoverEase] = useState(0);
  
  const [userName, setUserName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [likedReviews, setLikedReviews] = useState([]);

  useEffect(() => {
    if (REVIEWS_CACHE && (Date.now() - REVIEWS_CACHE_TIME < REVIEWS_CACHE_TTL)) {
      setReviews(REVIEWS_CACHE);
      setIsLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          setReviews(list);
          REVIEWS_CACHE = list;
          REVIEWS_CACHE_TIME = Date.now();
        } else {
          throw new Error('Failed to fetch from backend');
        }
      } catch (err) {
        console.error('Using fallback empty reviews due to API error.', err);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleHelpful = async (reviewId) => {
    if (likedReviews.includes(reviewId)) return;

    const reviewToUpdate = reviews.find(r => r.id === reviewId);
    if (!reviewToUpdate) return;
    const updatedReview = { ...reviewToUpdate, helpful: (reviewToUpdate.helpful || 0) + 1 };
    
    // Optimistic UI update
    setReviews(reviews.map(r => r.id === reviewId ? updatedReview : r));
    setLikedReviews([...likedReviews, reviewId]);

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReview)
      });
    } catch (err) {
      console.error('Failed to save helpful count to DB', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || accuracyRating === 0 || easeRating === 0 || !reviewText.trim() || !userName.trim()) return;

    setIsSubmitting(true);
    const newReview = {
      id: Date.now().toString(),
      name: userName.trim(),
      rating,
      accuracyRating,
      easeRating,
      text: reviewText.trim(),
      date: 'Just now',
      helpful: 0
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      setRating(0); setAccuracyRating(0); setEaseRating(0);
      setReviewText('');
      setUserName('');
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1) : 0;
  const avgAccuracy = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + (r.accuracy || r.rating || 0), 0) / totalReviews).toFixed(1) : 0;
  const avgEaseOfUse = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + (r.easeOfUse || r.rating || 0), 0) / totalReviews).toFixed(1) : 0;
  
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++; });

  return (
    <div className="min-h-[100dvh] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">

      <div className="relative z-10 max-w-5xl mx-auto px-2.5 sm:px-6 pt-16 sm:pt-24 pb-24 md:pb-20">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center mb-3 sm:mb-6">
          <button
            onClick={() => {
              if (window.history.state?.tab) {
                window.history.back();
              } else {
                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] sm:text-sm backdrop-blur-md border border-white/10 transition-all shadow-md active:scale-95"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-5 sm:mb-10">
          <h1 className="text-xl sm:text-3xl font-bold mb-1.5 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="sm:w-7 sm:h-7 text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            User Reviews
          </h1>
          <p className="text-white/60 text-xs sm:text-base">Real experiences from our community</p>
        </div>

        {/* Top Stats Row */}
        <div className="glass-panel border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 mb-4 sm:mb-8 shadow-xl grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-3 sm:gap-6 divide-x-0 sm:divide-x divide-white/10 text-center">
          <div className="flex-1 min-w-[100px] p-2">
            <div className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{avgRating}</div>
            <div className="flex justify-center text-yellow-400 mb-1 text-xs sm:text-sm">
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </div>
            <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold">Overall Rating</div>
          </div>
          <div className="flex-1 min-w-[100px] p-2 sm:pt-0">
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-3">{totalReviews}</div>
            <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold">Total Reviews</div>
          </div>
          <div className="flex-1 min-w-[100px] p-2 sm:pt-0">
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-3">{avgAccuracy}</div>
            <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold">Accuracy</div>
          </div>
          <div className="flex-1 min-w-[100px] p-2 sm:pt-0">
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-3">{avgEaseOfUse}</div>
            <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold">Ease of Use</div>
          </div>
        </div>

        {/* Main Grid: Breakdown & Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-10">
          
          {/* Rating Breakdown */}
          <div className="glass-panel border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-6">Rating Breakdown</h2>
            <div className="flex flex-col gap-2.5 sm:gap-4">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 sm:gap-4 text-xs sm:text-sm">
                    <span className="w-10 sm:w-12 text-white/70">{star} Stars</span>
                    <div className="flex-1 h-1.5 sm:h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-16 sm:w-20 text-right text-white/50">{count} ({Math.round(percentage)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Review */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl">
            <h2 className="text-sm sm:text-lg font-semibold mb-1">You Rate Us</h2>
            <p className="text-xs sm:text-sm text-white/50 mb-3 sm:mb-6">How would you rate your experience?</p>
            
            <form onSubmit={handleSubmit}>
              {/* Overall Rating */}
              <div className="mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-white/50 mb-1 sm:mb-2 uppercase tracking-wider">Overall Experience</p>
                <div className="flex gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-xl sm:text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= (hoverRating || rating) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Accuracy Rating */}
              <div className="mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-white/50 mb-1 sm:mb-2 uppercase tracking-wider">Forecast Accuracy</p>
                <div className="flex gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAccuracyRating(star)}
                      onMouseEnter={() => setHoverAccuracy(star)}
                      onMouseLeave={() => setHoverAccuracy(0)}
                      className="text-xl sm:text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= (hoverAccuracy || accuracyRating) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10'}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ease of Use Rating */}
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] sm:text-xs text-white/50 mb-1 sm:mb-2 uppercase tracking-wider">Ease of Use</p>
                <div className="flex gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEaseRating(star)}
                      onMouseEnter={() => setHoverEase(star)}
                      onMouseLeave={() => setHoverEase(0)}
                      className="text-xl sm:text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= (hoverEase || easeRating) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={50}
                className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs sm:text-sm mb-2.5 placeholder:text-white/30"
              />
              <textarea
                rows="3"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
                className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs sm:text-sm mb-2 resize-none placeholder:text-white/30"
              />
              <div className="flex justify-between items-center mt-1 sm:mt-2">
                <span className="text-[10px] sm:text-xs text-white/40">{reviewText.length}/500</span>
                <button
                  type="submit"
                  disabled={rating === 0 || accuracyRating === 0 || easeRating === 0 || !reviewText.trim() || !userName.trim() || isSubmitting}
                  className="px-4 py-1.5 sm:px-6 sm:py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/40 text-white rounded-full font-medium transition-colors text-xs sm:text-sm shadow-lg flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Review List */}
        <div>
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto scrollbar-none pb-1">
            <button className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-medium whitespace-nowrap">All Reviews ({totalReviews})</button>
            <button className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full glass-panel border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap">Most Helpful</button>
            <button className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full glass-panel border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap">Latest</button>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {isLoading ? (
              <div className="text-center py-10 text-white/50 text-xs sm:text-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-white/50 bg-white/10 rounded-2xl border border-white/10 text-xs sm:text-sm">Be the first to leave a review!</div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="glass-panel border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 transition-colors hover:bg-white/10">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs sm:text-lg shadow-inner">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white/90 text-xs sm:text-base">{review.name}</div>
                        <div className="text-[10px] sm:text-xs text-white/40">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex text-yellow-400 text-xs sm:text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">{review.text}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {review.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded glass-panel border border-white/10 text-[9px] sm:text-xs text-white/60">{tag}</span>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleHelpful(review.id)}
                      disabled={likedReviews.includes(review.id)}
                      className={`flex items-center gap-1 text-[11px] sm:text-xs transition-colors ${
                        likedReviews.includes(review.id) ? 'text-blue-400' : 'text-white/40 hover:text-blue-400'
                      }`}
                    >
                      <svg width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill={likedReviews.includes(review.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                      Helpful ({review.helpful || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
