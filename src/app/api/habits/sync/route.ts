import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, getRequestWorkspaceId } from "@/lib/supabase/client";
import { Habit } from "@/lib/types";
import { mapHabitToDbRow } from "@/lib/supabase/mappers";

// POST /api/habits/sync — bulk upsert habits & logs for a workspace in Supabase
export async function POST(request: NextRequest) {
  const workspaceId = getRequestWorkspaceId(request.headers);
  if (!workspaceId) {
    return NextResponse.json(
      { error: "x-workspace-id header (min 6 chars) is required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(workspaceId);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const habits: Habit[] = Array.isArray(body?.habits) ? body.habits : [];
    const replaceExisting = Boolean(body?.replace);

    if (replaceExisting) {
      await supabase.from("habit_logs").delete().eq("workspace_id", workspaceId);
      await supabase.from("habits").delete().eq("workspace_id", workspaceId);
    }

    if (habits.length === 0) {
      return NextResponse.json({ ok: true, syncedHabits: 0, syncedLogs: 0 });
    }

    const normalizedHabits: Habit[] = habits.map((h) => {
      if (!/^demo-habit-\d+$/.test(h.id)) return h;
      const scopedId = `${workspaceId}_${h.id}`;
      return {
        ...h,
        id: scopedId,
        logs: (h.logs || []).map((l) => ({
          ...l,
          id: `${workspaceId}_${l.id}`,
          habitId: scopedId,
        })),
      };
    });

    const habitRows = normalizedHabits.map((h, idx) => mapHabitToDbRow(h, workspaceId, idx));
    const { error: habitsErr } = await supabase
      .from("habits")
      .upsert(habitRows, { onConflict: "id" });

    if (habitsErr) {
      return NextResponse.json({ error: habitsErr.message }, { status: 500 });
    }

    const logRows = normalizedHabits.flatMap((h) =>
      (h.logs || []).map((l) => ({
        id: l.id || `log_${h.id}_${l.date}`,
        habit_id: h.id,
        workspace_id: workspaceId,
        date: l.date,
        value: Math.max(0, Math.floor(Number(l.value) || 0)),
        updated_at: new Date().toISOString(),
      }))
    );

    if (logRows.length > 0) {
      const { error: logsErr } = await supabase
        .from("habit_logs")
        .upsert(logRows, { onConflict: "habit_id,date" });

      if (logsErr) {
        return NextResponse.json({ error: logsErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      syncedHabits: habitRows.length,
      syncedLogs: logRows.length,
    });
  } catch (error) {
    console.error("Failed to sync habits:", error);
    return NextResponse.json({ error: "Failed to sync habits" }, { status: 500 });
  }
}
