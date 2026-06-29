"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Target, Database, Shield, Brain, BarChart3,
  LayoutDashboard, Server, MessageCircle, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Clock, FileCode, Terminal, Search, BookOpen,
  AlertTriangle, Star, Check, Library, Copy, Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFENSE_INFO,
  RNCP_CRITERIA,
  PRESENTATION_TIMELINE,
  GUIDE_DATA_SCIENCE_TIMELINE,
  GUIDE_ALIGNMENT,
  GUIDE_AUTO_CHECKLIST,
  COMMON_MISTAKES,
  INDIVIDUALIZATION_QUESTIONS,
  SLIDES_DATA_SCIENCE,
  ORAL_SPEECH_SCRIPT,
  SPEECH_SPLIT_SUMMARY,
  PHASES,
  JURY_QUESTIONS,
  COMMANDS_CHEATSHEET,
  SUBJECT_REQUIREMENTS,
  GLOSSARY,
  type Phase,
  type SpeechBlock,
} from "@/lib/soutenance-content";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  GraduationCap, Target, Database, Shield, Brain, BarChart3,
  LayoutDashboard, Server, MessageCircle,
};

const STORAGE_KEY = "soutenance-checklist-v2";
const GUIDE_CHECKLIST_KEY = "soutenance-guide-checklist-v1";

function StatusBadge({ status }: { status?: "required" | "bonus" | "partial" }) {
  if (!status) return null;
  const cfg = {
    required: { label: "Requis", color: "var(--green)", bg: "var(--green-dim)" },
    bonus:    { label: "Bonus",  color: "var(--purple)", bg: "rgba(139,92,246,0.12)" },
    partial:  { label: "Partiel", color: "var(--orange)", bg: "var(--orange-dim)" },
  }[status];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function SectionBlock({ section }: { section: Phase["sections"][0] }) {
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {section.title}
        </h4>
        <StatusBadge status={section.status} />
      </div>

      {section.paragraphs?.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {p}
        </p>
      ))}

      {section.bullets && (
        <ul className="space-y-1.5">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-card)" }}>
                {section.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className="border-t" style={{ borderColor: "var(--border)" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.codeRefs && (
        <div className="flex flex-wrap gap-2">
          {section.codeRefs.map((ref) => (
            <span
              key={ref.file}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-mono"
              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
            >
              <FileCode className="w-3 h-3" />
              {ref.file}
              <span style={{ color: "var(--text-muted)" }}>— {ref.detail}</span>
            </span>
          ))}
        </div>
      )}

      {section.oralTip && (
        <div
          className="flex gap-2 text-xs p-3 rounded-lg border-l-2"
          style={{
            background: "var(--orange-dim)",
            borderColor: "var(--orange)",
            color: "var(--text-secondary)",
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--orange)" }} />
          <div>
            <span className="font-semibold" style={{ color: "var(--orange)" }}>À dire à l&apos;oral : </span>
            {section.oralTip}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SoutenancePage() {
  const [activePhase, setActivePhase] = useState("phase-0");
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["phase-0"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [guideChecked, setGuideChecked] = useState<Set<string>>(new Set());
  const [qFilter, setQFilter] = useState("");
  const [qSourceFilter, setQSourceFilter] = useState<"all" | "guide" | "projet" | "individualisation">("all");
  const [speechSpeakerFilter, setSpeechSpeakerFilter] = useState<"all" | "Adrien" | "Quang Dat">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [gFilter, setGFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"phases" | "guide" | "rncp" | "timeline" | "speech" | "jury" | "glossary" | "commands">("speech");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
      const rawGuide = localStorage.getItem(GUIDE_CHECKLIST_KEY);
      if (rawGuide) setGuideChecked(new Set(JSON.parse(rawGuide) as string[]));
    } catch { /* ignore */ }
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleGuideCheck = useCallback((id: string) => {
    setGuideChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(GUIDE_CHECKLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const allCheckIds = useMemo(
    () => PHASES.flatMap((p) => p.checklist.map((c) => c.id)),
    [],
  );
  const allGuideCheckIds = useMemo(() => GUIDE_AUTO_CHECKLIST.map((c) => c.id), []);
  const progressPct = allCheckIds.length
    ? Math.round(
        ([...allCheckIds, ...allGuideCheckIds].filter(
          (id) => checked.has(id) || guideChecked.has(id),
        ).length /
          (allCheckIds.length + allGuideCheckIds.length)) *
          100,
      )
    : 0;

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allJuryQuestions = useMemo(
    () => [...JURY_QUESTIONS, ...INDIVIDUALIZATION_QUESTIONS],
    [],
  );

  const filteredQuestions = allJuryQuestions.filter(
    (q) => {
      const matchesText =
        !qFilter ||
        q.question.toLowerCase().includes(qFilter.toLowerCase()) ||
        q.category.toLowerCase().includes(qFilter.toLowerCase()) ||
        q.answer.toLowerCase().includes(qFilter.toLowerCase());
      const matchesSource =
        qSourceFilter === "all" ||
        q.source === qSourceFilter ||
        (!q.source && qSourceFilter === "projet");
      return matchesText && matchesSource;
    },
  );

  const speechById = useMemo(
    () => Object.fromEntries(ORAL_SPEECH_SCRIPT.map((b) => [b.id, b])) as Record<string, SpeechBlock>,
    [],
  );

  const copySpeech = useCallback(async (block: SpeechBlock) => {
    try {
      await navigator.clipboard.writeText(block.text);
      setCopiedId(block.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, []);

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const filteredGlossary = GLOSSARY.filter(
    (g) =>
      !gFilter ||
      g.term.toLowerCase().includes(gFilter.toLowerCase()) ||
      g.full.toLowerCase().includes(gFilter.toLowerCase()) ||
      g.definition.toLowerCase().includes(gFilter.toLowerCase()) ||
      g.category.toLowerCase().includes(gFilter.toLowerCase()),
  );
  const glossaryCategories = [...new Set(filteredGlossary.map((g) => g.category))];

  const tabs = [
    { id: "guide" as const, label: "Guide EFREI", icon: BookOpen },
    { id: "phases" as const, label: "Phases projet", icon: Target },
    { id: "rncp" as const, label: "RNCP", icon: GraduationCap },
    { id: "timeline" as const, label: "Timing 9 min", icon: Clock },
    { id: "speech" as const, label: "Script oral", icon: Mic },
    { id: "jury" as const, label: "Questions jury", icon: MessageCircle },
    { id: "glossary" as const, label: "Glossaire", icon: Library },
    { id: "commands" as const, label: "Commandes", icon: Terminal },
  ];

  function TimelineSection({
    title,
    subtitle,
    blocks,
  }: {
    title: string;
    subtitle: string;
    blocks: typeof PRESENTATION_TIMELINE;
  }) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "var(--border)" }} />
          <div className="space-y-4 pl-10">
            {blocks.map((block, i) => (
              <div key={i} className="relative">
                <div
                  className="absolute -left-[1.85rem] w-3 h-3 rounded-full border-2"
                  style={{ background: "var(--bg-primary)", borderColor: "var(--accent)" }}
                />
                <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                      {block.minutes}
                    </span>
                    <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{block.title}</h4>
                    <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{block.speaker}</span>
                  </div>
                  <ul className="space-y-1">
                    {block.content.map((line, li) => (
                      <li key={li} className="flex gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6 md:p-8"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Guide soutenance — {DEFENSE_INFO.subtitle}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {DEFENSE_INFO.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {DEFENSE_INFO.authors} · {DEFENSE_INFO.certification}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {DEFENSE_INFO.scope}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {DEFENSE_INFO.slot} · <strong style={{ color: "var(--text-secondary)" }}>{DEFENSE_INFO.presentationMinutes}</strong> oral · <strong style={{ color: "var(--text-secondary)" }}>{DEFENSE_INFO.slidesBudget}</strong> dans le deck global
            </p>
          </div>
          <div
            className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border"
            style={{ borderColor: "var(--border)", background: "var(--accent-dim)" }}
          >
            <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              {progressPct}%
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>préparé</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { icon: Clock, label: "Dates", value: DEFENSE_INFO.dates },
            { icon: GraduationCap, label: "Jury", value: DEFENSE_INFO.jury },
            { icon: Target, label: "Format", value: DEFENSE_INFO.format },
            { icon: Star, label: "Certification", value: "Bloc 2 RNCP40875" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                  {label}
                </span>
              </div>
              <p className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span
            className="text-xs px-3 py-1 rounded-full border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <strong style={{ color: "var(--text-primary)" }}>{DEFENSE_INFO.presentationMinutes}</strong> oral
          </span>
          <span
            className="text-xs px-3 py-1 rounded-full border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <strong style={{ color: "var(--text-primary)" }}>{DEFENSE_INFO.slidesBudget}</strong> slides
          </span>
          <button
            type="button"
            onClick={() => setActiveTab("speech")}
            className="text-xs px-3 py-1 rounded-full border flex items-center gap-1.5"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}
          >
            <Mic className="w-3 h-3" />
            Script oral Adrien / Quang Dat
          </button>
        </div>
        <p className="text-xs mt-3 p-3 rounded-lg border-l-2" style={{ background: "var(--bg-input)", borderColor: "var(--accent)", color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>Logique guide :</strong> {DEFENSE_INFO.logicFormula}
        </p>
      </motion.div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            )}
            style={{
              background: activeTab === id ? "var(--accent-dim)" : "transparent",
              color: activeTab === id ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── GUIDE EFREI TAB ── */}
      {activeTab === "guide" && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Alignement projet ↔ Guide EFREI — Data Science
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Verdict : le projet couvre C3.1 à C4.3. C4.1 (stratégie IA) surtout à verbaliser à l&apos;oral.
            </p>
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-input)" }}>
                    {["Exigence guide", "Comp.", "Statut", "Preuve / action"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GUIDE_ALIGNMENT.map((row, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{row.guideRequirement}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--accent)" }}>{row.competency}</td>
                      <td className="px-3 py-2">
                        {row.status === "ok" && <span style={{ color: "var(--green)" }}>✅ Aligné</span>}
                        {row.status === "partial" && <span style={{ color: "var(--orange)" }}>⚠️ Partiel</span>}
                        {row.status === "oral" && <span style={{ color: "var(--purple)" }}>🗣️ Verbaliser</span>}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                        {row.projectProof}
                        {row.oralAction && (
                          <span className="block mt-1 italic" style={{ color: "var(--orange)" }}>{row.oralAction}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Auto-vérification — Guide EFREI §6
            </h3>
            <div className="space-y-4">
              {[...new Set(GUIDE_AUTO_CHECKLIST.map((c) => c.section))].map((section) => (
                <div key={section}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--accent)" }}>
                    {section}
                  </p>
                  <div className="space-y-2">
                    {GUIDE_AUTO_CHECKLIST.filter((c) => c.section === section).map((item) => {
                      const done = guideChecked.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleGuideCheck(item.id)}
                          className="flex items-start gap-2 w-full text-left group"
                        >
                          {done
                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--green)" }} />
                            : <Circle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />}
                          <span className={cn("text-sm", done && "line-through opacity-60")} style={{ color: "var(--text-secondary)" }}>
                            {item.question}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Erreurs fréquentes — Guide EFREI §7
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {COMMON_MISTAKES.map((m) => (
                <div key={m.title} className="rounded-xl border p-4" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--orange)" }}>{m.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              Slides pour ce projet — {DEFENSE_INFO.slidesBudget}
            </h3>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              {DEFENSE_INFO.slidesBudgetDetail}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SLIDES_DATA_SCIENCE.map((s) => (
                <button
                  key={s.slide}
                  type="button"
                  onClick={() => setActiveTab("speech")}
                  className="rounded-lg border px-3 py-2 flex flex-col gap-1 text-left hover:opacity-90 transition-opacity"
                  style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}
                >
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                    Slide {s.slide} — {s.title}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {s.speaker} · {s.minutes}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.content}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("speech")}
              className="text-xs mt-3 font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              → Voir le script oral complet pour chaque slide
            </button>
          </div>
        </div>
      )}

      {/* ── SPEECH TAB ── */}
      {activeTab === "speech" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Script oral complet — 9 minutes · 5 slides
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Texte professionnel prêt à répéter · Adrien + Quang Dat · ~120 mots/min
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Adrien", "Quang Dat"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSpeechSpeakerFilter(f)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      borderColor: speechSpeakerFilter === f ? "var(--accent)" : "var(--border)",
                      background: speechSpeakerFilter === f ? "var(--accent-dim)" : "transparent",
                      color: speechSpeakerFilter === f ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {f === "all" ? "Les deux" : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {SPEECH_SPLIT_SUMMARY.map((row) => (
                <div
                  key={row.speaker}
                  className="rounded-xl border p-4 space-y-1.5"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: row.speaker === "Adrien" ? "var(--accent)" : "var(--purple)",
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{row.speaker}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    <strong>Slides :</strong> {row.slides} · <strong>Durée :</strong> {row.duration}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.topics}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide-by-slide: outline + full speech */}
          {SLIDES_DATA_SCIENCE.map((slideDef) => {
            const blocks = slideDef.speechIds
              .map((id) => speechById[id])
              .filter(Boolean)
              .filter(
                (b) =>
                  speechSpeakerFilter === "all" || b.speaker === speechSpeakerFilter,
              );
            if (blocks.length === 0) return null;

            return (
              <section
                key={slideDef.slide}
                className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div
                  className="px-5 py-4 border-b flex flex-wrap items-center gap-3"
                  style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}
                >
                  <span
                    className="text-lg font-bold tabular-nums px-3 py-1 rounded-xl"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    Slide {slideDef.slide}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {slideDef.title}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {slideDef.content}
                    </p>
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    <p><strong>Orateur :</strong> {slideDef.speaker}</p>
                    <p className="tabular-nums">{slideDef.minutes}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {blocks.map((block) => (
                    <article
                      key={block.id}
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div
                        className="px-4 py-2.5 border-b flex flex-wrap items-center gap-2"
                        style={{
                          borderColor: "var(--border)",
                          background:
                            block.speaker === "Adrien"
                              ? "var(--accent-dim)"
                              : "rgba(139,92,246,0.1)",
                        }}
                      >
                        <Mic
                          className="w-3.5 h-3.5"
                          style={{
                            color: block.speaker === "Adrien" ? "var(--accent)" : "var(--purple)",
                          }}
                        />
                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          {block.speaker}
                        </span>
                        <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {block.minutes}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          · {wordCount(block.text)} mots · ~{Math.round(wordCount(block.text) / 2)} s
                        </span>
                        <div className="flex flex-wrap gap-1 ml-auto">
                          {block.competencies.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: "var(--bg-input)", color: "var(--accent)" }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => copySpeech(block)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ml-1"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                          title="Copier le texte"
                        >
                          {copiedId === block.id ? (
                            <Check className="w-3 h-3" style={{ color: "var(--green)" }} />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedId === block.id ? "Copié" : "Copier"}
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {block.stageDirection && (
                          <p
                            className="text-xs italic px-3 py-2 rounded-lg border-l-2"
                            style={{
                              background: "var(--orange-dim)",
                              borderColor: "var(--orange)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <strong style={{ color: "var(--orange)" }}>Scène : </strong>
                            {block.stageDirection}
                          </p>
                        )}
                        <p
                          className="text-sm leading-relaxed whitespace-pre-line"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {block.text}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <p className="text-xs text-center pb-4" style={{ color: "var(--text-muted)" }}>
            Total script :{" "}
            {ORAL_SPEECH_SCRIPT.reduce((n, b) => n + wordCount(b.text), 0)} mots ·{" "}
            ~{Math.round(ORAL_SPEECH_SCRIPT.reduce((n, b) => n + wordCount(b.text), 0) / 120)} min à 120 mots/min
          </p>
        </div>
      )}

      {/* ── PHASES TAB ── */}
      {activeTab === "phases" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sticky phase nav */}
          <nav
            className="lg:w-56 flex-shrink-0 lg:sticky lg:top-20 lg:self-start space-y-1"
          >
            {PHASES.map((phase) => {
              const Icon = ICON_MAP[phase.icon] ?? BookOpen;
              const phaseChecks = phase.checklist.filter((c) => checked.has(c.id)).length;
              return (
                <button
                  key={phase.id}
                  onClick={() => {
                    setActivePhase(phase.id);
                    setExpandedPhases((p) => new Set([...p, phase.id]));
                    document.getElementById(phase.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all"
                  style={{
                    background: activePhase === phase.id ? "var(--accent-dim)" : "transparent",
                    color: activePhase === phase.id ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate">
                    {phase.number}. {phase.title}
                  </span>
                  <span className="tabular-nums text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {phaseChecks}/{phase.checklist.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Phase content */}
          <div className="flex-1 space-y-4 min-w-0">
            {PHASES.map((phase) => {
              const Icon = ICON_MAP[phase.icon] ?? BookOpen;
              const isOpen = expandedPhases.has(phase.id);
              return (
                <motion.section
                  key={phase.id}
                  id={phase.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <button
                    className="w-full flex items-start gap-3 p-5 text-left"
                    onClick={() => togglePhase(phase.id)}
                  >
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                      style={{ background: "var(--accent-dim)" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                          Phase {phase.number}
                        </span>
                        {phase.presentationMinutes && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                            {phase.presentationMinutes}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {phase.title}
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{phase.subtitle}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phase.rncp.map((r) => (
                          <span key={r} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--purple)", color: "#fff", opacity: 0.85 }}>
                            {r}
                          </span>
                        ))}
                        {phase.ef.map((e) => (
                          <span key={e} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />
                      : <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                          {phase.sections.map((section) => (
                            <SectionBlock key={section.id} section={section} />
                          ))}

                          {/* Checklist */}
                          <div
                            className="rounded-xl border p-4 space-y-2"
                            style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                              Checklist — suis-je prêt ?
                            </p>
                            {phase.checklist.map((item) => {
                              const done = checked.has(item.id);
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => toggleCheck(item.id)}
                                  className="flex items-start gap-2 w-full text-left group"
                                >
                                  {done
                                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--green)" }} />
                                    : <Circle className="w-4 h-4 flex-shrink-0 mt-0.5 group-hover:opacity-80" style={{ color: "var(--text-muted)" }} />}
                                  <span
                                    className={cn("text-sm", done && "line-through opacity-60")}
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    {item.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RNCP TAB ── */}
      {activeTab === "rncp" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Chaque compétence RNCP Bloc 2 est mappée à des preuves concrètes dans le projet.
            Utilisez ce tableau pour préparer les questions du jury.
          </p>

          {/* Subject requirements quick view */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Exigences du sujet vs projet
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-input)" }}>
                    {["Exigence", "Statut", "Notre réalisation"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUBJECT_REQUIREMENTS.map((r, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.req}</td>
                      <td className="px-4 py-2.5">
                        {r.status === "required"
                          ? <span className="inline-flex items-center gap-1" style={{ color: "var(--green)" }}><Check className="w-3 h-3" /> Requis</span>
                          : <span className="inline-flex items-center gap-1" style={{ color: "var(--purple)" }}><Star className="w-3 h-3" /> Bonus</span>}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {RNCP_CRITERIA.map((criterion) => (
            <div
              key={criterion.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: "var(--border)" }}>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  {criterion.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{criterion.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{criterion.description}</p>
                </div>
              </div>
              <div className="p-5 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Critères RNCP
                  </p>
                  <ul className="space-y-1.5">
                    {criterion.criteria.map((c, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--green)" }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Preuves dans notre projet
                  </p>
                  <ul className="space-y-1.5">
                    {criterion.projectProof.map((p, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {criterion.files.map((f) => (
                      <code
                        key={f}
                        className="text-[10px] px-2 py-0.5 rounded font-mono"
                        style={{ background: "var(--bg-input)", color: "var(--accent)" }}
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Script oral de <strong style={{ color: "var(--text-primary)" }}>9 minutes</strong> — projet Data Science uniquement.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("speech")}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium"
              style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" }}
            >
              <Mic className="w-3.5 h-3.5" />
              Script oral complet (Adrien / Quang Dat)
            </button>
          </div>
          <TimelineSection
            title="Déroulé oral — Marketing ROI (9 min)"
            subtitle="Question métier → prep → EDA → modélisation → comparaison & limites"
            blocks={GUIDE_DATA_SCIENCE_TIMELINE}
          />
        </div>
      )}

      {/* ── JURY Q&A TAB ── */}
      {activeTab === "jury" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Rechercher une question, catégorie ou mot-clé…"
              value={qFilter}
              onChange={(e) => setQFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "Toutes"],
              ["guide", "Guide EFREI"],
              ["projet", "Technique projet"],
              ["individualisation", "Individualisation"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setQSourceFilter(id)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: qSourceFilter === id ? "var(--accent)" : "var(--border)",
                  background: qSourceFilter === id ? "var(--accent-dim)" : "transparent",
                  color: qSourceFilter === id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""} — sur le projet Data Science (C3.1–C4.3)
          </p>
          <div className="space-y-3">
            {filteredQuestions.map((q, i) => (
              <details
                key={i}
                className="rounded-xl border group"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <summary
                  className="flex items-start gap-3 p-4 cursor-pointer list-none"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}
                    >
                      {q.category}
                    </span>
                    {q.source === "guide" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                        Guide
                      </span>
                    )}
                    {q.source === "individualisation" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: "rgba(139,92,246,0.15)", color: "var(--purple)" }}>
                        Perso
                      </span>
                    )}
                    <p className="text-sm font-medium mt-1.5" style={{ color: "var(--text-primary)" }}>
                      {q.question}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1 transition-transform group-open:rotate-180" style={{ color: "var(--text-muted)" }} />
                </summary>
                <div className="px-4 pb-4 pl-11">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {q.answer}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("phases");
                      setExpandedPhases((p) => new Set([...p, q.relatedPhase]));
                      setTimeout(() => document.getElementById(q.relatedPhase)?.scrollIntoView({ behavior: "smooth" }), 100);
                    }}
                    className="text-xs mt-2 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    → Voir phase associée
                  </button>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ── GLOSSARY TAB ── */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sens complet de chaque sigle et terme technique du projet. Objectif : pouvoir expliquer
            n&apos;importe quel mot au jury, sans hésitation.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Rechercher un terme (ex : RMSE, SHAP, ROI, data leakage…)"
              value={gFilter}
              onChange={(e) => setGFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredGlossary.length} terme{filteredGlossary.length !== 1 ? "s" : ""}
          </p>

          {glossaryCategories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3
                className="text-xs font-bold uppercase tracking-wider pt-2"
                style={{ color: "var(--accent)" }}
              >
                {cat}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredGlossary
                  .filter((g) => g.category === cat)
                  .map((g) => (
                    <div
                      key={g.term}
                      className="rounded-xl border p-4 space-y-1.5"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          {g.term}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                          {g.full}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {g.definition}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COMMANDS TAB ── */}
      {activeTab === "commands" && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Commandes essentielles pour la démo et les questions du jury.
          </p>
          {COMMANDS_CHEATSHEET.map(({ cmd, desc }) => (
            <div
              key={cmd}
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-xl border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <code
                className="text-xs font-mono px-3 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: "var(--bg-input)", color: "var(--accent)" }}
              >
                {cmd}
              </code>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
