import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, getRequestWorkspaceId } from "@/lib/supabase/client";
import { createDefaultDemoHabits } from "@/lib/demoData";
import { getCurrentWeekDays } from "@/lib/dates";
import { DbHabitRow, mapDbHabitToHabit, mapHabitToDbRow } from "@/lib/supabase/mappers";

// POST /api/habits/seed — seed demo habits for the current workspace in Supabase
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
    await supabase.from("habit_logs").delete().eq("workspace_id", workspaceId);
    await supabase.from("habits").delete().eq("workspace_id", workspaceId);

    const weekDays = getCurrentWeekDays();
    const demoHabits = createDefaultDemoHabits(weekDays).map((h) => ({
      ...h,
      id: `${workspaceId}_${h.id}`,
      logs: h.logs.map((l) => ({
        ...l,
        id: `${workspaceId}_${l.id}`,
        habitId: `${workspaceId}_${h.id}`,
      })),
    }));

    const habitRows = demoHabits.map((h, idx) => mapHabitToDbRow(h, workspaceId, idx));
    const { error: habitsErr } = await supabase.from("habits").insert(habitRows);
    if (habitsErr) {
      return NextResponse.json({ error: habitsErr.message }, { status: 500 });
    }

    const logRows = demoHabits.flatMap((h) =>
      h.logs.map((l) => ({
        id: l.id,
        habit_id: h.id,
        workspace_id: workspaceId,
        date: l.date,
        value: l.value,
      }))
    );

    if (logRows.length > 0) {
      const { error: logsErr } = await supabase.from("habit_logs").insert(logRows);
      if (logsErr) {
        return NextResponse.json({ error: logsErr.message }, { status: 500 });
      }
    }

    const { data: result, error: fetchErr } = await supabase
      .from("habits")
      .select("*, habit_logs(*)")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true });

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Demo data seeded",
      habits: ((result as DbHabitRow[]) || []).map(mapDbHabitToHabit),
    });
  } catch (error) {
    console.error("Failed to seed data:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}

// DELETE /api/habits/seed — wipe all habits and logs for this workspace in Supabase
export async function DELETE(request: NextRequest) {
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
    await supabase.from("habit_logs").delete().eq("workspace_id", workspaceId);
    await supabase.from("habits").delete().eq("workspace_id", workspaceId);
    return NextResponse.json({ message: "All habits and logs cleared successfully" });
  } catch (error) {
    console.error("Failed to clear data:", error);
    return NextResponse.json({ error: "Failed to clear habits data" }, { status: 500 });
  }
}
