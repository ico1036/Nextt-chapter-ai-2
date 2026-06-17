import { NextResponse } from "next/server";
import { addNote, getSession, listNotes, logEvent } from "@/lib/store";
import { reflectNoteAI } from "@/lib/ai";
import { computeProgress } from "@/lib/progress";
import { todayDateString } from "@/lib/note";
import type { DailyNote, MoodTag } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MOODS: MoodTag[] = [
  "confident",
  "anxious",
  "stuck_but_moved",
  "hopeful",
  "tired",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }
  const notes = await listNotes(sessionId);
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId: string | undefined = body?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const moodTag: MoodTag | undefined = MOODS.includes(body?.moodTag)
    ? body.moodTag
    : undefined;

  const now = new Date();
  const note: DailyNote = {
    id: `n_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    sessionId,
    createdAt: now.toISOString(),
    date: todayDateString(now),
    chosenDirection: session.report?.topRecommendation.label,
    todayAction: String(body?.todayAction ?? "").trim(),
    moodTag,
    customerVoice: String(body?.customerVoice ?? "").trim(),
    insight: String(body?.insight ?? "").trim(),
    nextStep: String(body?.nextStep ?? "").trim(),
  };

  // Deterministic reflection, optionally warmed up by Claude.
  note.reflection = await reflectNoteAI(note);

  await addNote(sessionId, note);

  // Compass + gamification snapshot after this note (for the celebration).
  const notes = await listNotes(sessionId);
  const progress = computeProgress(session, notes);

  await logEvent({
    id: `e_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    sessionId,
    type: "note_created",
    meta: { moodTag, hasAction: Boolean(note.todayAction), clarity: progress.clarity },
    at: now.toISOString(),
  });

  return NextResponse.json({ note, progress });
}
