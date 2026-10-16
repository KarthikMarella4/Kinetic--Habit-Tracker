"use client";

import { useState } from "react";
import { HabitsProvider, useHabits } from "@/components/HabitsProvider";
import StatusBar from "@/components/StatusBar";
import Header from "@/components/Header";
import DayStrip from "@/components/DayStrip";
import WeeklyChart from "@/components/WeeklyChart";
import HabitsList from "@/components/HabitsList";
import AnalyticsView from "@/components/AnalyticsView";
import ManageView from "@/components/ManageView";
import BottomNav from "@/components/BottomNav";
import HabitModal from "@/components/HabitModal";
import SettingsModal from "@/components/SettingsModal";
import Toast from "@/components/Toast";

function AppShell() {
  const { activeTab, loading } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenModal = (habitId?: string) => {
    setEditHabitId(habitId || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditHabitId(null);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#f8f8fa] dark:bg-[#121316] sm:bg-[#ebebef] sm:dark:bg-[#0b0c0e] text-zinc-900 dark:text-zinc-100 flex justify-center sm:items-center selection:bg-[#FF4F00] selection:text-white sm:py-6 kinetic-grid-bg transition-colors duration-200">
      <div className="w-full sm:max-w-[420px] bg-[#f8f8fa] dark:bg-[#121316] border-0 sm:border border-zinc-300/80 dark:border-zinc-800/80 rounded-none sm:rounded-[42px] flex flex-col h-[100dvh] sm:h-[880px] shadow-none sm:shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden transition-colors duration-200 kinetic-grid-bg">
        {/* Status Bar */}
        <StatusBar onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Global Toast */}
        <Toast />

        {/* Header Section directly on continuous grid */}
        <Header />

        {/* Main Scrollable View with continuous blueprint grid */}
        <main className="flex-1 overflow-y-auto kinetic-grid-bg">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Initializing Protocol...
              </p>
            </div>
          ) : activeTab === "dashboard" ? (
            <div className="space-y-4 pt-1 pb-4">
              <DayStrip />
              <WeeklyChart />
              <HabitsList onOpenModal={handleOpenModal} />
            </div>
          ) : activeTab === "analytics" ? (
            <div className="pt-3 pb-4">
              <AnalyticsView />
            </div>
          ) : (
            <div className="pt-2 pb-4">
              <ManageView onOpenModal={handleOpenModal} />
            </div>
          )}
        </main>

        {/* Static Bottom Stage Navigation */}
        <div className="w-full shrink-0 z-30">
          <BottomNav onOpenModal={() => handleOpenModal()} />
        </div>

        {/* Create / Edit Habit Modal */}
        <HabitModal
          isOpen={isModalOpen}
          editHabitId={editHabitId}
          onClose={handleCloseModal}
        />

        {/* App Settings & Data Management Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <HabitsProvider>
      <AppShell />
    </HabitsProvider>
  );
}
