import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/habits/seed — seed demo habits for the current week
export async function POST() {
  try {
    // Get current week Monday-Sunday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }

    // Clear existing data
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();

    // Seed habits
    const habitsData = [
      {
        name: "Deep Work: Core Architecture",
        category: "Deep Work",
        color: "#FF4F00",
        target: 2,
        unit: "blocks",
        streak: 14,
        order: 0,
        dailyValues: [2, 2, 2, 2, 1, 0, 0],
      },
      {
        name: "Strength & Mobility Session",
        category: "Fitness",
        color: "#10B981",
        target: 1,
        unit: "workout",
        streak: 9,
        order: 1,
        dailyValues: [1, 1, 0, 1, 1, 1, 0],
      },
      {
        name: "Hydration Protocol (3L)",
        category: "Wellness",
        color: "#2563EB",
        target: 6,
        unit: "500ml",
        streak: 21,
        order: 2,
        dailyValues: [6, 6, 5, 6, 4, 3, 0],
      },
      {
        name: "Read Technical Papers / Books",
        category: "Learning",
        color: "#7C3AED",
        target: 20,
        unit: "pages",
        streak: 7,
        order: 3,
        dailyValues: [20, 15, 20, 20, 10, 0, 0],
      },
      {
        name: "Zero-Screen Wind Down (10 PM)",
        category: "Wellness",
        color: "#F59E0B",
        target: 1,
        unit: "night",
        streak: 5,
        order: 4,
        dailyValues: [1, 1, 1, 1, 0, 0, 0],
      },
    ];

    for (const hData of habitsData) {
      const habit = await prisma.habit.create({
        data: {
          name: hData.name,
          category: hData.category,
          color: hData.color,
          target: hData.target,
          unit: hData.unit,
          streak: hData.streak,
          order: hData.order,
        },
      });

      // Create logs for each day of the week
      const logEntries = weekDates.map((date, i) => ({
        habitId: habit.id,
        date,
        value: hData.dailyValues[i],
      }));

      await prisma.habitLog.createMany({ data: logEntries });
    }

    const result = await prisma.habit.findMany({
      include: { logs: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ message: "Demo data seeded", habits: result });
  } catch (error) {
    console.error("Failed to seed data:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/seed — wipe all habits and logs for a completely fresh start
export async function DELETE() {
  try {
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    return NextResponse.json({ message: "All habits and logs cleared successfully" });
  } catch (error) {
    console.error("Failed to clear data:", error);
    return NextResponse.json(
      { error: "Failed to clear habits data" },
      { status: 500 }
    );
  }
}

