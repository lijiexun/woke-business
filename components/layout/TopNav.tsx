"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  active: "overview" | "journals" | "fields" | "authors" | "keywords";
  onChange: (value: Props["active"]) => void;
};

const items: Props["active"][] = ["overview", "fields", "journals", "authors", "keywords"];
const itemLabel: Record<Props["active"], string> = {
  overview: "Overview",
  fields: "Disciplines",
  journals: "Journals",
  authors: "Authors",
  keywords: "Keywords"
};

export function TopNav({ active, onChange }: Props) {
  return (
    <nav className="panel sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-2 p-3">
      <div className="flex items-end gap-3">
        <Image
          src="/brand/woke-stamp.svg"
          alt="WOKE"
          width={300}
          height={106}
          className="h-9 w-auto sm:h-10 md:h-11"
          priority
        />
        <div className="pb-0.5">
          <div className="brand-business">Business</div>
        </div>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[0.11em] text-stone-600 sm:inline">
          How Woke Is Business Academia, Really?
        </span>
      </div>

      <div className="menu-strip">
        {items.map((item, idx) => (
          <span key={item} className="contents">
            {idx > 0 && <span className="menu-sep">|</span>}
            <button
              className={active === item ? "menu-link menu-link-active" : "menu-link"}
              onClick={() => onChange(item)}
            >
              {itemLabel[item]}
            </button>
          </span>
        ))}
        <span className="menu-sep">|</span>
        <Link href="/about" className="menu-link">
          About
        </Link>
      </div>
    </nav>
  );
}
