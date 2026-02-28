"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rainbowColorByRank } from "@/lib/keywordColor";

type Word = { text: string; value: number; earlyRate?: number; lateRate?: number };
type Box = { x: number; y: number; width: number; height: number };
type PlacedWord = Word & { x: number; y: number; fontSize: number; color: string; delayMs: number };

function intersects(a: Box, b: Box): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

function estimateBox(text: string, fontSize: number): { width: number; height: number } {
  const width = Math.max(fontSize * 1.8, text.length * fontSize * 0.56);
  const height = fontSize * 1.18;
  return { width, height };
}

function halton(index: number, base: number): number {
  let i = index;
  let f = 1;
  let r = 0;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

function layoutWords(words: Word[], width: number, height: number, seed: number): PlacedWord[] {
  const max = words.length ? Math.max(...words.map((w) => w.value)) : 1;
  const min = words.length ? Math.min(...words.map((w) => w.value)) : 0;
  const spread = Math.max(1e-9, max - min);
  const margin = 14;
  const innerW = Math.max(10, width - margin * 2);
  const innerH = Math.max(10, height - margin * 2);
  const placed: Array<PlacedWord & { box: Box }> = [];

  words.forEach((w, idx) => {
    const weight = (w.value - min) / spread;
    const baseSize = 11 + Math.pow(Math.max(0, weight), 0.8) * 24; // size shows frequency
    let candidate: (PlacedWord & { box: Box }) | null = null;
    const anchorX = margin + halton(idx + 1 + seed, 2) * innerW;
    const anchorY = margin + halton(idx + 1 + seed, 3) * innerH;

    for (let shrink = 0; shrink < 4 && !candidate; shrink += 1) {
      const fontSize = Math.max(10, baseSize * (1 - shrink * 0.1));
      const { width: bw, height: bh } = estimateBox(w.text, fontSize);
      for (let i = 0; i < 1800; i += 1) {
        const ring = Math.floor(i / 28);
        const angle = ((i % 28) / 28) * Math.PI * 2 + idx * 0.17;
        const radius = ring * 4;
        const x = anchorX + Math.cos(angle) * radius - bw / 2;
        const y = anchorY + Math.sin(angle) * radius - bh / 2;

        const box = { x, y, width: bw, height: bh };
        if (box.x < margin || box.y < margin || box.x + box.width > width - margin || box.y + box.height > height - margin) {
          continue;
        }
        if (placed.some((p) => intersects(p.box, box))) continue;

        candidate = {
          ...w,
          x: box.x,
          y: box.y,
          fontSize,
          color: rainbowColorByRank(idx, words.length),
          delayMs: Math.min(500, idx * 12),
          box
        };
        break;
      }
    }

    // Fallback pass: place remaining words with broader search so we fill the canvas.
    if (!candidate) {
      const fontSize = Math.max(10, baseSize * 0.85);
      const { width: bw, height: bh } = estimateBox(w.text, fontSize);
      const cx = width / 2;
      const cy = height / 2;
      for (let i = 0; i < 2200; i += 1) {
        const t = i / 2200;
        const angle = i * 0.33;
        const radius = Math.min(width, height) * 0.55 * Math.sqrt(t);
        const x = cx + Math.cos(angle) * radius - bw / 2;
        const y = cy + Math.sin(angle) * radius - bh / 2;
        const box = { x, y, width: bw, height: bh };
        if (box.x < margin || box.y < margin || box.x + box.width > width - margin || box.y + box.height > height - margin) continue;
        if (placed.some((p) => intersects(p.box, box))) continue;
        candidate = {
          ...w,
          x: box.x,
          y: box.y,
          fontSize,
          color: rainbowColorByRank(idx, words.length),
          delayMs: Math.min(500, idx * 12),
          box
        };
        break;
      }
    }

    if (candidate) placed.push(candidate);
  });

  return placed.map(({ box: _box, ...rest }) => rest);
}

export function TagCloud({ words, onClick }: { words: Word[]; onClick?: (word: string, color: string) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 880, height: 360 });
  const [animateIn, setAnimateIn] = useState(false);
  const [seed, setSeed] = useState(17);

  useEffect(() => {
    if (!hostRef.current) return;
    const update = () => {
      const width = Math.max(320, Math.round(hostRef.current?.clientWidth ?? 880));
      setSize({ width, height: 360 });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 997) + 1);
    setAnimateIn(false);
    const id = window.setTimeout(() => setAnimateIn(true), 20);
    return () => window.clearTimeout(id);
  }, [words]);

  const sortedWords = useMemo(() => [...words].sort((a, b) => b.value - a.value).slice(0, 80), [words]);
  const placed = useMemo(() => layoutWords(sortedWords, size.width, size.height, seed), [sortedWords, size.width, size.height, seed]);

  return (
    <div ref={hostRef} className="min-h-64 rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-2">
      {placed.length ? (
        <div className="relative h-[360px] overflow-hidden">
          {placed.map((w) => (
            <button
              key={w.text}
              className="absolute whitespace-nowrap bg-transparent px-1 text-left font-semibold tracking-tight"
              style={{
                left: `${w.x}px`,
                top: `${w.y}px`,
                fontSize: `${w.fontSize}px`,
                color: w.color,
                textShadow: "0 1px 0 rgba(255,255,255,0.85)",
                opacity: animateIn ? 1 : 0,
                transform: animateIn ? "translateY(0) scale(1)" : "translateY(6px) scale(0.96)",
                transition: `opacity 320ms ease, transform 360ms ease`,
                transitionDelay: `${w.delayMs}ms`
              }}
              title={w.earlyRate != null ? `Early ${w.earlyRate.toFixed(2)} / Late ${w.lateRate?.toFixed(2)}` : `Count: ${w.value}`}
              onClick={() => onClick?.(w.text, w.color)}
            >
              {w.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid h-64 place-items-center text-sm text-slate-500">No keywords for current filters.</div>
      )}
    </div>
  );
}
