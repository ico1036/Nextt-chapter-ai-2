"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalSession, type LocalSession } from "@/lib/session-client";
import { track } from "@/lib/track";

// Shown on the landing hero only for returning users who already
// finished onboarding — a one-tap way back into the daily log.
export default function ReturningBanner() {
  const [session, setSession] = useState<LocalSession | null>(null);

  useEffect(() => {
    setSession(getLocalSession());
  }, []);

  if (!session) return null;

  return (
    <Link
      href={`/next/${session.sessionId}`}
      onClick={() => track("resume_clicked", undefined, session.sessionId)}
      className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-clay/30 bg-clay-tint px-4 py-2 text-sm font-medium text-clay-deep shadow-sm transition hover:bg-clay/15"
    >
      <span>🌿</span>
      {session.name ? `${session.name}님, ` : ""}내 기록으로 이어가기
      <span aria-hidden>→</span>
    </Link>
  );
}
