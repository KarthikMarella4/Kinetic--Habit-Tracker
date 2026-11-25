import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, getRequestWorkspaceId } from "@/lib/supabase/client";
import { DbHabitRow, mapDbHabitToHabit } from "@/lib/supabase/mappers";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/habits/:id — update a habit in Supabase
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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
      name,
      category,
      color,
      target,
      unit,
      streak,
      order,
      timerMinutes,
      startDate,
      scheduleType,
      scheduledDate,
    } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (color !== undefined) updates.color = color;
    if (target !== undefined) updates.target = Math.max(1, Math.floor(Number(target) || 1));
    if (unit !== undefined) updates.unit = unit;
    if (streak !== undefined) updates.streak = Math.max(0, Math.floor(Number(streak) || 0));
    if (order !== undefined) updates.sort_order = Math.floor(Number(order) || 0);
    if (timerMinutes !== undefined) updates.timer_minutes = timerMinutes ?? null;
    if (startDate !== undefined) updates.start_date = startDate ?? null;
    if (scheduleType !== undefined) updates.schedule_type = scheduleType;
    if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate ?? null;

    const { data, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("*, habit_logs(*)")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json(mapDbHabitToHabit(data as DbHabitRow));
  } catch (error) {
    console.error("Failed to update habit:", error);
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
  }
}

// DELETE /api/habits/:id — delete a habit and its logs from Supabase
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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
    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete habit:", error);
    return NextResponse.json({ success: true });
  }
}
