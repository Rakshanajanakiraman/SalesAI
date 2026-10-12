import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Star, Send, CheckCircle2,
  Clock, User, Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("Feature Suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/feedback/');
      setFeedbackList(res.data || []);
    } catch (err) {
      console.error("Feedback load error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    try {
      await api.post('/feedback/', { rating, category, message });
      setSuccessNotice(true);
      setMessage("");
      fetchFeedback();
      setTimeout(() => setSuccessNotice(false), 5000);
    } catch (err) {
      alert("Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
          Platform Feedback & Product Ideas
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Share your feedback, report an issue, or request an AI algorithm enhancement.
        </p>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Thank you! Your feedback has been recorded and submitted to our engineering product roadmap.</span>
        </div>
      )}

      {/* Submission Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <h3 className="text-base font-bold font-['Outfit'] text-white">
          Send Us Your Thoughts
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star Rating */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Overall Experience Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
              <span className="text-slate-400 ml-2 font-semibold">({rating} of 5 Stars)</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Feedback Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
            >
              <option value="Feature Suggestion">Feature Suggestion / Enhancement</option>
              <option value="AI Accuracy">AI Model Predictions & Accuracy</option>
              <option value="POS Usability">Point of Sale (POS) Usability</option>
              <option value="Reporting & GST">Reporting & GST Tax Slabs</option>
              <option value="Bug Report">Technical Bug Report</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Your Message *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you liked or what features would make running your store easier..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn px-6 py-2.5 rounded-xl text-white font-semibold flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Submitting..." : "Send Feedback"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Past Community Submissions ({feedbackList.length})
        </h3>

        <div className="space-y-3">
          {feedbackList.map(f => (
            <div key={f.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-white">{f.category}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(f.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{f.message}</p>
              <div className="text-[10px] text-slate-500">By: {f.user_name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
