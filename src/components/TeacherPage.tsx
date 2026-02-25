import React, { useEffect, useState } from 'react';
import { Play, User, Calendar, Star, MessageSquare, Save } from 'lucide-react';
import { motion } from 'motion/react';

interface Submission {
  id: number;
  student_name: string;
  audio_data: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

export default function TeacherPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const res = await fetch('/api/submissions');
    const data = await res.json();
    setSubmissions(data);
  };

  const handleGrade = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, score, feedback })
      });
      await fetchSubmissions();
      setSelected(null);
      setScore(0);
      setFeedback('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel (Teacher)</h1>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
          {submissions.length} ta topshiriq
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          {submissions.map((sub) => (
            <motion.div
              key={sub.id}
              whileHover={{ x: 5 }}
              onClick={() => {
                setSelected(sub);
                setScore(sub.score || 0);
                setFeedback(sub.feedback || '');
              }}
              className={`glass p-4 rounded-2xl cursor-pointer transition-all ${
                selected?.id === sub.id ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{sub.student_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {sub.score !== null && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <Star size={12} fill="currentColor" /> Baholangan: {sub.score}/10
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Grading Area */}
        <div className="lg:col-span-2">
          {selected ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-8 rounded-3xl sticky top-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Play className="text-indigo-600" /> {selected.student_name} javobi
              </h2>

              <div className="mb-8 p-6 bg-slate-900 rounded-2xl">
                <audio src={selected.audio_data} controls className="w-full invert" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" /> Ball (0-10)
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                    {[...Array(11)].map((_, i) => <span key={i}>{i}</span>)}
                  </div>
                  <div className="text-center mt-2 font-bold text-2xl text-indigo-600">{score}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-500" /> Fikr-mulohaza (Feedback)
                  </label>
                  <textarea 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Talabaga tavsiyalaringizni yozing..."
                  />
                </div>

                <button
                  onClick={handleGrade}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {loading ? "Saqlanmoqda..." : <><Save size={20} /> Natijani saqlash</>}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl p-12">
              Baholash uchun chapdan talabani tanlang
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
