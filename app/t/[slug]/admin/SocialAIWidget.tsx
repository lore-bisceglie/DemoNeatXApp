"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Calendar, Lock } from "lucide-react";
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
    <div className="flex flex-col gap-8 items-center justify-center py-12 md:py-24">
      <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 md:p-12 rounded-3xl shadow-2xl border border-purple-500/30 max-w-3xl w-full text-center relative overflow-hidden group">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-600/30 transition-colors" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-white shadow-2xl shadow-purple-500/20 mb-6">
            <Lock size={48} className="text-purple-400 mb-2" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold uppercase tracking-wider mb-6">
            <Sparkles size={16} className="animate-pulse" />
            Esclusiva Piano Elite
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Il tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Social Media Manager</span> Personale.
          </h2>

          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Dimentica lo stress di gestire Instagram. La nostra Intelligenza Artificiale scriverà per te i testi perfetti, sceglierà gli hashtag migliori e pubblicherà in automatico i tuoi lavori, facendoti trovare decine di nuovi clienti.
          </p>

          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-3 text-lg hover:scale-105 active:scale-95">
            <Calendar size={24} /> Mettiti in Lista d'Attesa
          </button>
          
          <p className="text-slate-500 text-sm mt-6 font-medium">
            Prossimamente in arrivo per i primissimi saloni selezionati.
          </p>
        </div>
      </div>
    </div>
  );
}
