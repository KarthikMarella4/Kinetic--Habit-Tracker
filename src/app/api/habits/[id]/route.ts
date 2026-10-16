import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/habits/:id — update a habit
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, category, color, target, unit } = body;

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(color !== undefined && { color }),
        ...(target !== undefined && { target }),
        ...(unit !== undefined && { unit }),
      },
      include: { logs: true },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("Failed to update habit:", error);
    return NextResponse.json(
      { error: "Failed to update habit" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/:id — delete a habit and its logs
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (_) {
    // If habit was client-created or already deleted, treat as success
    return NextResponse.json({ success: true });
  }
}
