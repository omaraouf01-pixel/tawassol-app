"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ArrowLeft, Plus, X, Check,
  Loader2, AlertCircle, BookOpen, Tag as TagIcon,
  Shield, HelpCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";

/* ════════════════════════════════════════════════════════════════════
   CREATE GROUP — POST /api/groups via MongoDB (zéro Firestore)
══════════════════════════════════════════════════════════════════════ */

const SUBJECTS = [
  "Informatique", "Mathématiques", "Physique", "Chimie", "Biologie",
  "Architecture", "Gestion", "Littérature", "Droit", "Médecine", "Ingénierie", "Autre",
];
const MAX_TAGS = 5;
const MAX_QUESTIONS = 4;

export default function CreateGroupPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Informatique");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("1. Respecter tous les membres\n2. Pas de plagiat\n3. Restez sur le sujet");
  const [maxMembers, setMaxMembers] = useState(30);
  const [questions, setQuestions] = useState(["Pourquoi voulez-vous rejoindre ce groupe ?"]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { if (u) setCurrentUser(u); });
  }, []);

  /* ── Tags ── */
  const addTag = () => {
    const v = tagInput.trim();
    if (!v || tags.includes(v) || tags.length >= MAX_TAGS) { setTagInput(""); return; }
    setTags([...tags, v]);
    setTagInput("");
    if (errors.tags) setErrors({ ...errors, tags: null });
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));
  const handleTagKey = (e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } };

  /* ── Questions ── */
  const addQuestion = () => { if (questions.length < MAX_QUESTIONS) setQuestions([...questions, ""]); };
  const updateQuestion = (i, v) => { const n = [...questions]; n[i] = v; setQuestions(n); };
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Le nom du groupe est requis.";
    else if (name.trim().length < 3) e.name = "Le nom doit contenir au moins 3 caractères.";
    if (!description.trim()) e.description = "Veuillez décrire l'objectif du groupe.";
    if (!subject) e.subject = "Sélectionnez une matière.";
    const n = Number(maxMembers);
    if (!n || n < 2 || n > 200) e.maxMembers = "Entre 2 et 200 membres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit → POST /api/groups ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) { setSubmitError("Veuillez corriger les champs en rouge."); return; }
    if (!currentUser) { setSubmitError("Session expirée. Veuillez vous reconnecter."); return; }

    setIsLoading(true);
    try {
      const result = await api("/api/groups", {
        method: "POST",
        body: {
          name: name.trim(), subject,
          description: description.trim(),
          rules: rules.trim(),
          maxMembers: Number(maxMembers),
          tags,
          questions: questions.filter((q) => q.trim()),
        },
      });
      router.push(`/hub/chat/${result.id}`);
    } catch (err) {
      setSubmitError(err?.message || "Une erreur est survenue.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden font-sans antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
      </div>

      <header className="bg-[#0F172A]/70 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={17} />
        </button>
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 ring-1 ring-white/20">
          <Users size={16} className="text-white" />
        </div>
        <h1 className="text-lg font-black text-white tracking-tight">Créer un groupe d&apos;étude</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Section icon={BookOpen} title="Informations du groupe">
            <Field label="Nom du groupe" required error={errors.name}>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: null }); }}
                placeholder="ex. Groupe Algorithmes Info" className={inputClass(errors.name)} />
            </Field>
            <Field label="Matière" required error={errors.subject}>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass(errors.subject)}>
                {SUBJECTS.map((s) => <option key={s} value={s} className="bg-[#1e1e2e]">{s}</option>)}
              </select>
            </Field>
            <Field label="Description" required error={errors.description}>
              <textarea value={description}
                onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: null }); }}
                placeholder="Quel est l'objectif de ce groupe ?" className={`${inputClass(errors.description)} h-24 resize-none`} />
            </Field>
            <Field label="Nombre maximum de membres" required error={errors.maxMembers}>
              <input type="number" value={maxMembers}
                onChange={(e) => { setMaxMembers(e.target.value); if (errors.maxMembers) setErrors({ ...errors, maxMembers: null }); }}
                min={2} max={200} className={inputClass(errors.maxMembers)} />
            </Field>
          </Section>

          <Section icon={TagIcon} title={`Tags (${tags.length}/${MAX_TAGS})`}>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-1">
                {tags.map((t) => (
                  <span key={t} className="group flex items-center gap-1.5 bg-indigo-500/15 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-400/30">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-indigo-300/60 hover:text-rose-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey}
                placeholder={tags.length >= MAX_TAGS ? "Limite atteinte" : "Ajouter un tag (Entrée)…"}
                disabled={tags.length >= MAX_TAGS}
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white placeholder:text-slate-500 disabled:opacity-50" />
              <button type="button" onClick={addTag} disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-indigo-500/30 ring-1 ring-white/15 disabled:opacity-40 active:scale-95">
                <Plus size={16} />
              </button>
            </div>
          </Section>

          <Section icon={Shield} title="Règles du groupe">
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} className={`${inputClass()} h-28 resize-none`} />
          </Section>

          <Section icon={HelpCircle} title={`Questions de filtrage (${questions.length}/${MAX_QUESTIONS})`}
            headerExtra={questions.length < MAX_QUESTIONS && (
              <button type="button" onClick={addQuestion} className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300">
                <Plus size={13} /> Ajouter
              </button>
            )}>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={q} onChange={(e) => updateQuestion(i, e.target.value)} placeholder={`Question ${i + 1}`} className={inputClass()} />
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(i)} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {submitError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-400/30 rounded-2xl text-rose-300 text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0" />{submitError}
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className={`relative group w-full py-4 rounded-full font-black text-sm transition-all shadow-xl ring-1 ring-white/15 flex items-center justify-center gap-2.5 ${
              isLoading ? "bg-indigo-500/60 text-white/80 cursor-not-allowed opacity-60 shadow-none"
                : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/40 active:scale-[0.98]"
            }`}>
            {!isLoading && <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity rounded-full" />}
            <span className="relative flex items-center gap-2.5">
              {isLoading ? (<><Loader2 size={16} className="animate-spin" /> Création en cours…</>) : (<><Check size={16} /> Créer le groupe &amp; ouvrir le chat</>)}
            </span>
          </button>
        </form>
      </main>
    </div>
  );
}

/* ═══ Helpers ═══ */
function inputClass(err) {
  return `w-full bg-white/[0.04] border rounded-2xl px-4 py-3 text-sm outline-none transition-all text-white placeholder:text-slate-500 ${
    err ? "border-red-500/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      : "border-white/10 focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10"
  }`;
}
function Section({ icon: Icon, title, headerExtra, children }) {
  return (
    <div className="bg-white/[0.04] rounded-[28px] border border-white/10 backdrop-blur-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-xs text-slate-300 uppercase tracking-widest flex items-center gap-2">
          {Icon && <Icon size={13} className="text-indigo-400" />}{title}
        </h2>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label} {required && <span className="text-indigo-400">*</span>}
      </label>
      {children}
      {error && <p className="flex items-center gap-1 text-[11px] text-red-400 font-semibold mt-1.5 ml-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}
