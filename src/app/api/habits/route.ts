import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/habits — fetch all habits with logs for current week
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  try {
    const habits = await prisma.habit.findMany({
      orderBy: { order: "asc" },
      include: {
        logs:
          startDate && endDate
            ? {
                where: {
                  date: { gte: startDate, lte: endDate },
                },
              }
            : true,
      },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("Failed to fetch habits:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

// POST /api/habits — create a new habit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, color, target, unit } = body;

    if (!name || !category || !color) {
      return NextResponse.json(
        { error: "Name, category, and color are required" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.habit.aggregate({ _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const habit = await prisma.habit.create({
      data: {
        name,
        category,
        color,
        target: target || 1,
        unit: unit || "session",
        order: nextOrder,
      },
      include: { logs: true },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("Failed to create habit:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
