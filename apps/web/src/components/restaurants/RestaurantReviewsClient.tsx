"use client";

import { useState } from "react";
import { StarRating } from "@/components/hotels/StarRating";
import { ReviewCard } from "@/components/hotels/ReviewCard";
import type { RestaurantReviewWithUser } from "@/types/restaurants";

interface Props {
  restaurantId: string;
  initialReviews: RestaurantReviewWithUser[];
  avgRating: number | null;
  distribution: { star: number; count: number }[];
  isAuthenticated: boolean;
}

export function RestaurantReviewsClient({ restaurantId, initialReviews, avgRating, distribution, isAuthenticated }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const total = reviews.length;
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title: title || undefined, comment }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Failed to submit review.");
    else { setReviews((prev) => [data.review, ...prev]); setSuccess(true); setShowForm(false); }
  }

  return (
    <div>
      {avgRating !== null && total > 0 && (
        <div className="bg-surface rounded-2xl border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row gap-6">
          <div className="text-center sm:border-r sm:border-gray-100 sm:pr-6 flex-shrink-0">
            <p className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="md" className="justify-center mt-2" />
            <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-gray-500 text-right">{star}</span>
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-gray-400 w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && !success && !showForm && (
        <button onClick={() => setShowForm(true)} className="mb-5 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 px-5 py-2.5 rounded-xl text-sm font-medium transition">
          ✍️ Write a review
        </button>
      )}
      {!isAuthenticated && (
        <a href="/auth/login" className="inline-block mb-5 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          Sign in to write a review
        </a>
      )}
      {success && <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-sm text-green-700">✓ Your review has been published.</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Your review</h3>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                  <svg className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title (optional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Summarise your experience" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={10} maxLength={1000} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Share your dining experience…" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50">
              {loading ? "Submitting…" : "Submit review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
          </div>
        </form>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={{ ...review, hotelId: review.restaurantId }} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">No reviews yet — be the first to share your dining experience!</p>
      )}
    </div>
  );
}
