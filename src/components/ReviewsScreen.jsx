import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';

// ----------------------------------------------------------------------------
// NPOINT API INTEGRATION
// Replace this with your actual npoint JSON bin URL
// It should return an array of review objects: [{ id, name, rating, text, date, helpful }]
// ----------------------------------------------------------------------------
const NPOINT_API_URL = 'https://api.npoint.io/e6aa544b3fe9a473d014'; 

const MOCK_REVIEWS = [
  { id: 1, name: 'Priya Patel', rating: 5, text: 'Amazing platform! Gave me accurate weather updates during our trek in the hills.', date: '3 days ago', helpful: 18, tags: ['Accurate', 'Helpful Alerts'] },
  { id: 2, name: 'Vikram Joshi', rating: 4, text: 'Love the AI chat feature. It feels like talking to a real meteorologist!', date: '1 week ago', helpful: 15, tags: ['AI Chat', 'Easy to Use'] },
  { id: 3, name: 'Sneha Reddy', rating: 5, text: 'Great for daily use. UI is smooth and information is really detailed.', date: '2 weeks ago', helpful: 9, tags: ['Detailed Info'] },
];

export default function ReviewsScreen() {
  const { state } = useApp();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch reviews from npoint API
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(NPOINT_API_URL);
        if (response.ok) {
          const data = await response.json();
          // If npoint is empty or invalid, fallback to mock data
          setReviews(Array.isArray(data) && data.length > 0 ? data : MOCK_REVIEWS);
        } else {
          throw new Error('Failed to fetch from npoint');
        }
      } catch (err) {
        console.warn('Using fallback local storage / mock data due to Npoint API error.');
        const local = JSON.parse(localStorage.getItem('weathergpt-reviews') || 'null');
        setReviews(local || MOCK_REVIEWS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !reviewText.trim()) return;

    setIsSubmitting(true);
    const newReview = {
      id: Date.now(),
      name: 'Guest User', // Or fetch from auth if you have it
      rating,
      text: reviewText,
      date: 'Just now',
      helpful: 0,
      tags: ['New']
    };

    const updatedReviews = [newReview, ...reviews];
    
    try {
      // Save to npoint API
      await fetch(NPOINT_API_URL, {
        method: 'POST', // Note: Npoint uses POST to update the entire JSON bin
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReviews)
      });
      setReviews(updatedReviews);
      localStorage.setItem('weathergpt-reviews', JSON.stringify(updatedReviews));
      setRating(0);
      setReviewText('');
    } catch (err) {
      console.error('Failed to submit review', err);
      // Fallback local save
      setReviews(updatedReviews);
      localStorage.setItem('weathergpt-reviews', JSON.stringify(updatedReviews));
      setRating(0);
      setReviewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : 0;
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++; });

  return (
    <div className="min-h-[100dvh] bg-[#0a0c1a] text-white overflow-y-auto pb-24 md:pb-20 relative font-body transition-colors duration-1000">
      {/* Background styling matching the dark theme */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 opacity-30" style={{ backgroundImage: `url('/backgrounds/amoled_clear.jpg')` }}></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a0c1a]/80 via-[#0a0c1a]/95 to-[#0a0c1a] pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

      <Header />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            User Reviews
          </h1>
          <p className="text-white/60 text-sm sm:text-base">Real experiences from our amazing community</p>
        </div>

        {/* Top Stats Row */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-xl flex flex-wrap items-center justify-between gap-6 divide-x-0 sm:divide-x divide-white/10 text-center">
          <div className="flex-1 min-w-[120px]">
            <div className="text-4xl font-bold text-white mb-2">{avgRating}</div>
            <div className="flex justify-center text-yellow-400 mb-1 text-sm">
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Overall Rating</div>
          </div>
          <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="text-3xl font-bold text-white mb-3">{totalReviews}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total Reviews</div>
          </div>
          <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="text-3xl font-bold text-white mb-3">4.9</div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Accuracy</div>
          </div>
          <div className="flex-1 min-w-[120px] pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="text-3xl font-bold text-white mb-3">4.7</div>
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Ease of Use</div>
          </div>
        </div>

        {/* Main Grid: Breakdown & Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Rating Breakdown */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-semibold mb-6">Rating Breakdown</h2>
            <div className="flex flex-col gap-4">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingCounts[star];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-4 text-sm">
                    <span className="w-12 text-white/70">{star} Stars</span>
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-20 text-right text-white/50">{count} ({Math.round(percentage)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Review */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">You Rate Us</h2>
            <p className="text-sm text-white/50 mb-6">How would you rate your experience?</p>
            
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span className={star <= (hoverRating || rating) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                rows="3"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm mb-2 resize-none placeholder:text-white/30"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/40">{reviewText.length}/500</span>
                <button
                  type="submit"
                  disabled={rating === 0 || !reviewText.trim() || isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/40 text-white rounded-full font-medium transition-colors text-sm shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Review List */}
        <div>
          <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide pb-2">
            <button className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium whitespace-nowrap">All Reviews ({totalReviews})</button>
            <button className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors whitespace-nowrap">Most Helpful</button>
            <button className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors whitespace-nowrap">Latest</button>
          </div>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="text-center py-10 text-white/50">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-white/50 bg-white/5 rounded-3xl border border-white/10">Be the first to leave a review!</div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 transition-colors hover:bg-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-inner">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white/90">{review.name}</div>
                        <div className="text-xs text-white/40">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex text-yellow-400 text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">{review.text}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {review.tags?.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] sm:text-xs text-white/60">{tag}</span>
                      ))}
                    </div>
                    <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-blue-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                      Helpful ({review.helpful})
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
