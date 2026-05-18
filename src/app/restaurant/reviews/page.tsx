'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Review {
  id: number;
  order_id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function RestaurantReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [newReviewFlash, setNewReviewFlash] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const info = (localStorage.getItem('restaurantInfo') || sessionStorage.getItem('restaurantInfo'));
    const token = (localStorage.getItem('restaurantToken') || sessionStorage.getItem('restaurantToken'));
    if (!token || !info) { router.push('/restaurant/login'); return; }
    const parsed = JSON.parse(info);
    setRestaurantId(parsed.id);
    fetchReviews(parsed.id);
    connectWS(parsed.id);
    return () => { wsRef.current?.close(); };
  }, []);

  const fetchReviews = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/restaurant/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setAvgRating(data.average_rating);
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const connectWS = (id: number) => {
    const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws/restaurant/${id}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_review' && msg.review) {
          const r: Review = msg.review;
          setReviews(prev => {
            const updated = [r, ...prev];
            const avg = updated.reduce((s, x) => s + x.rating, 0) / updated.length;
            setAvgRating(Math.round(avg * 10) / 10);
            return updated;
          });
          setNewReviewFlash(r.id);
          setTimeout(() => setNewReviewFlash(null), 3000);
        }
      } catch {}
    };
    ws.onclose = () => setTimeout(() => connectWS(id), 3000);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const Stars = ({ rating, size = '1rem' }: { rating: number; size?: string }) => (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  );

  const ratingColor = (r: number) => r >= 4 ? '#10b981' : r === 3 ? '#f59e0b' : '#ef4444';

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#9ca3af', margin: 0 }}>Loading reviews...</p>
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center',
        gap: '1rem', position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <button
          onClick={() => router.push('/restaurant/dashboard')}
          style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: 'white', cursor: 'pointer', fontSize: '0.9rem', color: '#555',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
            Customer Reviews
          </h1>
        </div>
        <div style={{ marginLeft: 'auto' }} />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

        {/* Summary */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          boxShadow: '0 1px 8px rgba(0,0,0,0.07)', marginBottom: '1.5rem',
          display: 'flex', gap: '2.5rem', alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Big number */}
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '4rem', fontWeight: '800', color: '#f59e0b', lineHeight: 1 }}>
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <Stars rating={Math.round(avgRating)} size="1.3rem" />
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.4rem' }}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280', width: '8px', textAlign: 'right' }}>{star}</span>
                  <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★</span>
                  <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: '99px',
                      background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', width: '24px' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '4rem 2rem',
            textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.07)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>
              No reviews yet. They'll appear here instantly when customers rate their orders.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {reviews.map(review => (
              <div
                key={review.id}
                style={{
                  background: newReviewFlash === review.id ? '#fffbeb' : 'white',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                  borderLeft: `4px solid ${ratingColor(review.rating)}`,
                  transition: 'background 0.5s ease',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${ratingColor(review.rating)}, #6366f1)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0
                    }}>
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.95rem' }}>
                        {review.user_name}
                        {newReviewFlash === review.id && (
                          <span style={{
                            marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: '700',
                            background: '#f59e0b', color: 'white',
                            padding: '0.15rem 0.5rem', borderRadius: '99px'
                          }}>New</span>
                        )}
                      </div>
                      <Stars rating={review.rating} size="0.95rem" />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Comment */}
                {review.comment ? (
                  <p style={{
                    margin: 0, color: '#374151', fontSize: '0.92rem',
                    lineHeight: '1.6', fontStyle: 'italic',
                    paddingLeft: '0.25rem'
                  }}>
                    "{review.comment}"
                  </p>
                ) : (
                  <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.82rem', fontStyle: 'italic' }}>
                    No comment
                  </p>
                )}

                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Order #{review.order_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
