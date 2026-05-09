import React from 'react';
import { BrainCircuit, ChevronRight, Gauge, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { ViewState } from '../App';
import type { AiInsight } from '../lib/aiInsights';

const TONE_STYLES = {
  positive: {
    shell:
      'from-emerald-500/16 via-cyan-500/10 to-slate-900/5 dark:from-emerald-400/16 dark:via-cyan-400/10 dark:to-white/5',
    icon: 'bg-emerald-500 text-white',
    badge: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-400/10',
  },
  warning: {
    shell:
      'from-amber-500/18 via-rose-500/10 to-slate-900/5 dark:from-amber-400/16 dark:via-rose-400/10 dark:to-white/5',
    icon: 'bg-amber-500 text-white',
    badge: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-400/10',
  },
  neutral: {
    shell:
      'from-sky-500/16 via-indigo-500/10 to-slate-900/5 dark:from-sky-400/16 dark:via-indigo-400/10 dark:to-white/5',
    icon: 'bg-sky-500 text-white',
    badge: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-400/10',
  },
} as const;

export function AiInsightCard({
  insight,
  onNavigate,
}: Readonly<{ insight: AiInsight; onNavigate: (view: ViewState) => void }>) {
  const tone = TONE_STYLES[insight.tone];

  const getTargetView = (label: string): ViewState => {
    if (label.includes('งบ')) return 'budget';
    if (label.includes('หมวด')) return 'categories';
    if (label.includes('วิเคราะห์')) return 'analytics';
    return 'add_transaction';
  };
  const targetView = getTargetView(insight.actionLabel);

  return (
    <section className="px-4 pt-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={() => onNavigate(targetView)}
        className={`ai-surface w-full bg-gradient-to-br ${tone.shell} text-left rounded-[1.35rem] p-3.5 border border-white/70 dark:border-slate-700/70 shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-2xl ${tone.icon} flex items-center justify-center shadow-lg`}>
            <BrainCircuit size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ${tone.badge}`}
              >
                <Sparkles size={11} />
                อินไซต์ AI
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary">
                <Gauge size={12} />
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
            <h3 className="text-[15px] font-extrabold text-text-dark dark:text-white leading-snug">{insight.title}</h3>
            <p className="text-[12px] font-medium text-secondary leading-relaxed mt-1">{insight.summary}</p>
          </div>
          <div className="size-8 rounded-xl bg-white/80 dark:bg-slate-900/80 text-text-dark dark:text-white flex items-center justify-center shrink-0">
            <ChevronRight size={17} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-secondary">
          <ShieldCheck size={13} className="text-primary" />
          วิเคราะห์จากข้อมูลในเครื่องก่อน และใช้ Gemini เพิ่มความแม่นเมื่อเชื่อม endpoint แล้ว
        </div>
      </motion.button>
    </section>
  );
}
