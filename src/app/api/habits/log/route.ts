import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/habits/log — upsert a habit log for a specific date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { habitId, date, value } = body;

    if (!habitId || !date || value === undefined) {
      return NextResponse.json(
        { error: "habitId, date, and value are required" },
        { status: 400 }
      );
    }

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: { habitId, date },
      },
      update: { value },
      create: { habitId, date, value },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Failed to upsert log:", error);
    return NextResponse.json(
      { error: "Failed to update log" },
      { status: 500 }
    );
  }
}
