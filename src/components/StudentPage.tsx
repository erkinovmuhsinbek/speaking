import React, { useState, useRef } from 'react';
import { Mic, Square, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Savollar ro'yxati (Exam questions)
  const questions = [
    "Describe your hometown and what you like about it.",
    "What are your hobbies and why do you enjoy them?",
    "Talk about a memorable trip you have taken."
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mikrofonga ruxsat berilmadi:", err);
      alert("Iltimos, mikrofonga ruxsat bering!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!studentName || !audioBlob) return;
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentName, audioData: base64Audio })
        });
        
        if (res.ok) {
          setIsSubmitted(true);
        }
      } catch (err) {
        console.error("Yuborishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-3xl text-center max-w-md w-full"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Muvaffaqiyatli yuborildi!</h2>
          <p className="text-slate-500">Imtihon topshirganingiz uchun rahmat. O'qituvchingiz tez orada baholaydi.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl"
      >
        <h1 className="text-3xl font-bold mb-6 text-slate-900">English Speaking Exam</h1>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ismingizni kiriting</label>
          <input 
            type="text" 
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="Masalan: Ali Valiyev"
          />
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-lg text-slate-800">Imtihon savollari:</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          {!audioBlob ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white shadow-lg`}
            >
              {isRecording ? <Square fill="currentColor" /> : <Mic size={32} />}
            </button>
          ) : (
            <div className="w-full space-y-4">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
              <button 
                onClick={() => setAudioBlob(null)}
                className="text-sm text-slate-500 hover:text-red-500 transition-colors block mx-auto"
              >
                Qaytadan yozish
              </button>
            </div>
          )}
          <p className="mt-4 text-sm font-medium text-slate-500">
            {isRecording ? "Yozib olinmoqda..." : audioBlob ? "Yozuv tayyor" : "Yozishni boshlash uchun bosing"}
          </p>
        </div>

        <button
          disabled={!audioBlob || !studentName || loading}
          onClick={handleSubmit}
          className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Yuborilmoqda..." : <><Send size={20} /> Javobni yuborish</>}
        </button>
      </motion.div>
    </div>
  );
}
