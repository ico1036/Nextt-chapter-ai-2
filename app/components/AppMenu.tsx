"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getLocalSession,
  saveLocalSession,
  type LocalSession,
} from "@/lib/session-client";
import { track } from "@/lib/track";

// Drop into any page header. If `sessionId` is passed (result / note
// pages), it refreshes the remembered session. Renders a menu only
// once the user has completed onboarding at least once.
export default function AppMenu({
  sessionId,
  name,
}: {
  sessionId?: string;
  name?: string;
}) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionId) saveLocalSession(sessionId, name);
    const local = getLocalSession();
    // On pages that already know the session (result / note / week),
    // trust the prop directly — the menu shows even if localStorage is
    // unavailable (private mode). On the landing we rely on storage.
    if (sessionId) {
      setSession({ sessionId, name: name ?? local?.name, at: Date.now() });
    } else {
      setSession(local);
    }
    setMounted(true);
  }, [sessionId, name]);

  if (!mounted || !session) return null;

  const sid = session.sessionId;
  const items = [
    { href: `/next/${sid}`, label: "오늘의 기록", icon: "📓" },
    { href: `/next/${sid}/week`, label: "이번 주 회고", icon: "↻" },
    { href: `/result/${sid}`, label: "진단 결과", icon: "🌅" },
    { href: "/start", label: "새로 진단하기", icon: "✦" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) track("menu_opened", undefined, sid);
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-sm font-medium text-ink-soft shadow-sm backdrop-blur transition hover:border-clay hover:text-clay"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {session.name ? (
          <span className="max-w-[7rem] truncate text-ink">
            {session.name}님
          </span>
        ) : (
          <span>내 기록</span>
        )}
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-3.5 rounded bg-current" />
          <span className="block h-[2px] w-3.5 rounded bg-current" />
          <span className="block h-[2px] w-3.5 rounded bg-current" />
        </span>
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="animate-fade-in absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
          >
            <p className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wider text-clay">
              My Next Chapter
            </p>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                role="menuitem"
                onClick={() => {
                  track("menu_navigate", { to: it.label }, sid);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-[0.95rem] text-ink transition hover:bg-cream-2"
              >
                <span className="w-5 text-center text-clay">{it.icon}</span>
                {it.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
