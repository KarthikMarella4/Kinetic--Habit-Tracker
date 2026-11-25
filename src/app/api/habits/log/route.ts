import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, getRequestWorkspaceId } from "@/lib/supabase/client";
import { DbHabitLogRow, mapDbLogToHabitLog } from "@/lib/supabase/mappers";

// POST /api/habits/log — upsert a habit log for a specific date in Supabase
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
    const { habitId, date, value } = body;

    if (!habitId || !date || value === undefined) {
      return NextResponse.json(
        { error: "habitId, date, and value are required" },
        { status: 400 }
      );
    }

    const scopedHabitId = /^demo-habit-\d+$/.test(habitId)
      ? `${workspaceId}_${habitId}`
      : habitId;
    const logId = `log_${scopedHabitId}_${date}`;
    const { data, error } = await supabase
      .from("habit_logs")
      .upsert(
        {
          id: logId,
          habit_id: scopedHabitId,
          workspace_id: workspaceId,
          date,
          value: Math.max(0, Math.floor(Number(value) || 0)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "habit_id,date" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbLogToHabitLog(data as DbHabitLogRow));
  } catch (error) {
    console.error("Failed to upsert log:", error);
    return NextResponse.json({ error: "Failed to update log" }, { status: 500 });
  }
}
