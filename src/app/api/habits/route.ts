import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, getRequestWorkspaceId } from "@/lib/supabase/client";
import { DbHabitRow, mapDbHabitToHabit } from "@/lib/supabase/mappers";

// GET /api/habits — fetch all habits with logs from Supabase for this workspace
export async function GET(request: NextRequest) {
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
    const { data, error } = await supabase
      .from("habits")
      .select("*, habit_logs(*)")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const habits = ((data as DbHabitRow[]) || []).map(mapDbHabitToHabit);
    return NextResponse.json(habits, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch habits:", error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

// POST /api/habits — create a new habit in Supabase
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
    const {
      id,
      name,
      category,
      color,
      target,
      unit,
      streak,
      timerMinutes,
      startDate,
      scheduleType,
      scheduledDate,
    } = body;

    if (!name || !category || !color) {
      return NextResponse.json(
        { error: "Name, category, and color are required" },
        { status: 400 }
      );
    }

    const { data: existingMax } = await supabase
      .from("habits")
      .select("sort_order")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((existingMax?.sort_order as number | undefined) ?? -1) + 1;
    const habitId =
      id && typeof id === "string"
        ? id
        : `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const { data, error } = await supabase
      .from("habits")
      .upsert(
        {
          id: habitId,
          workspace_id: workspaceId,
          name,
          category,
          color,
          target: Math.max(1, Math.floor(Number(target) || 1)),
          unit: unit || "session",
          streak: Math.max(0, Math.floor(Number(streak) || 0)),
          sort_order: nextOrder,
          timer_minutes: timerMinutes ?? null,
          start_date: startDate ?? null,
          schedule_type: scheduleType || "daily",
          scheduled_date: scheduledDate ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("*, habit_logs(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbHabitToHabit(data as DbHabitRow), { status: 201 });
  } catch (error) {
    console.error("Failed to create habit:", error);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
