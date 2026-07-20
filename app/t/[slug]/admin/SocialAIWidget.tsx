"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Sparkles, Camera, Clock, Calendar, Check, X, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

interface Post {
  id: string;
  imageUrl: string | null;
  caption: string;
  scheduledFor: string | null;
  platform: string;
  status: string;
}

export default function SocialAIWidget({ slug }: { slug: string }) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/social/posts?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
      setCaptions([]);
      setSelectedCaptionIndex(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!imageBase64) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, imageBase64 })
      });
      const data = await res.json();
      if (data.captions) {
        setCaptions(data.captions);
      } else {
        Swal.fire("Errore", data.error || "Impossibile generare", "error");
      }
    } catch (e) {
      Swal.fire("Errore", "Errore di connessione", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCaption = (index: number) => {
    setSelectedCaptionIndex(index);
    setEditedCaption(captions[index]);
  };

  const handleSchedule = async () => {
    if (!editedCaption || !scheduledDate || !scheduledTime) {
      Swal.fire("Attenzione", "Scegli un testo, una data e un'ora", "warning");
      return;
    }
    setIsSaving(true);
    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          imageUrl: imageBase64,
          caption: editedCaption,
          scheduledFor,
          platform: "INSTAGRAM"
        })
      });
      if (res.ok) {
        Swal.fire("Programmato!", "Il post è stato inserito in coda", "success");
        setImageBase64(null);
        setCaptions([]);
        setSelectedCaptionIndex(null);
        setEditedCaption("");
        setScheduledDate("");
        setScheduledTime("");
        fetchPosts();
      } else {
        Swal.fire("Errore", "Salvataggio fallito", "error");
      }
    } catch (e) {
      Swal.fire("Errore", "Errore di connessione", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Vuoi annullare questo post?")) return;
    await fetch(`/api/social/posts?slug=${slug}&postId=${id}`, { method: "DELETE" });
    fetchPosts();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">NeatX Social AI</h2>
            <p className="text-slate-300">Il tuo Social Media Manager personale, sempre attivo.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: CREATION */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            1. Carica una foto del lavoro
          </h3>
          
          {!imageBase64 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer bg-slate-800/50 transition-colors"
            >
              <UploadCloud size={40} className="text-slate-500 mb-3" />
              <p className="text-slate-400 font-medium">Clicca per caricare un'immagine</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden group">
              <img src={imageBase64} alt="Preview" className="w-full h-48 object-cover opacity-80" />
              <button 
                onClick={() => setImageBase64(null)}
                className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

          {imageBase64 && captions.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Sparkles className="animate-pulse" size={20} /> : <Sparkles size={20} />}
              {isGenerating ? "L'AI sta analizzando la foto..." : "Scrivi Testi con l'AI"}
            </button>
          )}

          {captions.length > 0 && selectedCaptionIndex === null && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-300 mt-2">2. Scegli il testo generato</h3>
              {captions.map((cap, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSelectCaption(i)}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-purple-500 cursor-pointer transition-colors"
                >
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{cap}</p>
                </div>
              ))}
            </div>
          )}

          {selectedCaptionIndex !== null && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-300">Testo Scelto (Modificabile)</h3>
                <button onClick={() => setSelectedCaptionIndex(null)} className="text-xs text-purple-400 hover:underline">Scegli un altro</button>
              </div>
              <textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[120px] resize-none"
              />

              <h3 className="text-sm font-bold text-slate-300 mt-2">3. Programma la pubblicazione</h3>
              <div className="flex gap-4">
                <input 
                  type="date" 
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:border-purple-500 outline-none"
                />
                <input 
                  type="time" 
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-32 bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:border-purple-500 outline-none"
                />
              </div>

              <button
                onClick={handleSchedule}
                disabled={isSaving}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Clock size={20} />
                Metti in coda di pubblicazione
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUEUE */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-purple-400" />
            Calendario Pubblicazioni
          </h3>

          {posts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
              <Camera size={48} className="text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">Nessun post programmato</p>
              <p className="text-xs text-slate-500 mt-2">Usa l'AI per creare il tuo primo post!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {posts.map(post => (
                <div key={post.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-4 items-start group">
                  {post.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <img src={post.imageUrl} className="w-full h-full object-cover" alt="post" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> PROGRAMMATO
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nessuna data'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{post.caption}</p>
                  </div>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="text-slate-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
