"use client";

import { useState, useEffect, useRef } from "react";
import { useHabits } from "./HabitsProvider";
import {
  X,
  User,
  RotateCcw,
  Trash2,
  Check,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Calendar,
  Snowflake,
  Bell,
  Download,
  Upload,
  Sliders,
} from "lucide-react";
import {
  SOUND_OPTIONS,
  SoundProfile,
  getSavedSoundProfile,
  setSavedSoundProfile,
  getSavedSoundVolume,
  setSavedSoundVolume,
  playSound,
} from "@/lib/sound";
import { WeekStartDay } from "@/lib/dates";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parse24To12(time24: string) {
  const [hStr, mStr] = (time24 || "20:00").split(":");
  let h = parseInt(hStr || "20", 10);
  if (isNaN(h)) h = 20;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = mStr && mStr.length === 2 ? mStr : "00";
  return {
    hour: String(h12).padStart(2, "0"),
    minute: m,
    period,
  };
}

function convert12To24(hourStr: string, minuteStr: string, period: "AM" | "PM") {
  let h = parseInt(hourStr, 10);
  if (isNaN(h)) h = 12;
  if (period === "PM") {
    h = h === 12 ? 12 : h + 12;
  } else {
    h = h === 12 ? 0 : h;
  }
  return `${String(h).padStart(2, "0")}:${minuteStr}`;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    userName,
    setUserName,
    seedDemo,
    clearAllData,
    showToast,
    weekStartDay,
    setWeekStartDay,
    freezeUntil,
    setStreakFreeze,
    isFreezeActive,
    reminderEnabled,
    reminderTime,
    setReminderSettings,
    exportBackupData,
    importBackup,
    todayIso,
  } = useHabits();

  const [nameInput, setNameInput] = useState(userName);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundProfile>("swiss");
  const [previewingSound, setPreviewingSound] = useState<SoundProfile | null>(null);
  const [soundVolume, setSoundVolume] = useState(80);
  const [dataAction, setDataAction] = useState<"restore" | "clear">("restore");
  const [reminderActive, setReminderActive] = useState(false);
  const [reminderHour, setReminderHour] = useState("08");
  const [reminderMinute, setReminderMinute] = useState("00");
  const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">("PM");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameInput(userName);
    setConfirmClear(false);
    setDataAction("restore");
    if (isOpen) {
      setSelectedSound(getSavedSoundProfile());
      setSoundVolume(Math.round(getSavedSoundVolume() * 100));
      const parsed = parse24To12(reminderTime || "20:00");
      setReminderHour(parsed.hour);
      setReminderMinute(parsed.minute);
      setReminderPeriod(parsed.period);
      setReminderActive(reminderEnabled);
    }
  }, [userName, isOpen, reminderTime, reminderEnabled]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setUserName(nameInput.trim());
    showToast("Profile Name Updated");
  };

  const handleSelectSound = (profile: SoundProfile) => {
    setSelectedSound(profile);
    setSavedSoundProfile(profile);
    const found = SOUND_OPTIONS.find((s) => s.id === profile);
    showToast(`Sound: ${found?.name || profile}`);
  };

  const handlePreviewSound = (profile: SoundProfile) => {
    setPreviewingSound(profile);
    playSound(profile, soundVolume / 100);
    setTimeout(() => {
      setPreviewingSound((curr) => (curr === profile ? null : curr));
    }, 1500);
  };

  const handleVolumeChange = (newVal: number) => {
    setSoundVolume(newVal);
    setSavedSoundVolume(newVal / 100);
  };

  const handleToggleReminder = async (enabled: boolean) => {
    setReminderActive(enabled);
    const time24 = convert12To24(reminderHour, reminderMinute, reminderPeriod);
    await setReminderSettings(enabled, time24);
  };

  const handleTimeChange = async (h: string, m: string, p: "AM" | "PM") => {
    setReminderHour(h);
    setReminderMinute(m);
    setReminderPeriod(p);
    const time24 = convert12To24(h, m, p);
    if (reminderActive) {
      await setReminderSettings(true, time24);
    }
  };

  const handleExportBackup = () => {
    const backup = exportBackupData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kinetic-backup-${todayIso}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup File Downloaded");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        await importBackup(parsed);
      } catch (_) {
        showToast("Invalid Backup File");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSeedDemo = async () => {
    setIsResetting(true);
    await seedDemo();
    setIsResetting(false);
    onClose();
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setIsResetting(true);
    await clearAllData();
    setIsResetting(false);
    setConfirmClear(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#151619] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-pop max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] transition-colors">
        {/* iOS Drag Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4F00] font-bold">
              PREFERENCES
            </span>
            <h3 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
              App Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {/* Section 1: User Profile Name */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#FF4F00]" />
              <label
                htmlFor="user-name-input"
                className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-800 dark:text-zinc-200"
              >
                Profile Name
              </label>
            </div>
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                id="user-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="min-w-0 flex-1 px-3 py-2 text-base sm:text-sm font-medium rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF4F00]"
              />
              <button
                type="submit"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          </div>

          {/* Section 2: Completion Sound & Volume Slider */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#FF4F00]" />
              <label
                htmlFor="completion-sound-select"
                className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-800 dark:text-zinc-200"
              >
                Completion Sound
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <select
                  id="completion-sound-select"
                  value={selectedSound}
                  onChange={(e) => handleSelectSound(e.target.value as SoundProfile)}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base sm:text-sm font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  {SOUND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.icon} {opt.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {selectedSound !== "mute" && (
                <button
                  type="button"
                  onClick={() => handlePreviewSound(selectedSound)}
                  title="Test selected sound"
                  className={`shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs ${
                    previewingSound === selectedSound
                      ? "bg-[#FF4F00] text-white animate-pulse"
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95"
                  }`}
                >
                  {previewingSound === selectedSound ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      <span>Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Volume Slider */}
            {selectedSound !== "mute" && (
              <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center gap-3">
                {soundVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-zinc-400 shrink-0" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#FF4F00] shrink-0" />
                )}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={soundVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  aria-label="Sound Volume"
                  className="flex-1 accent-[#FF4F00] h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 w-9 text-right shrink-0">
                  {soundVolume}%
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Scheduling & Preferences */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-[#FF4F00]" />
              <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-800 dark:text-zinc-200">
                Preferences &amp; Rules
              </h4>
            </div>

            {/* Week Starts On */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Week Starts On</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Calendar Strip</span>
              </div>
              <div className="relative">
                <select
                  value={weekStartDay}
                  onChange={(e) => setWeekStartDay(e.target.value as WeekStartDay)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Vacation / Streak Freeze Mode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Streak Freeze (Vacation Mode)</span>
                </span>
                {isFreezeActive && (
                  <span className="text-[10px] font-mono text-cyan-500 font-bold animate-pulse">
                    ❄️ Active
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={isFreezeActive ? (freezeUntil ? "active" : "0") : "0"}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setStreakFreeze(days);
                  }}
                  className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-950 border text-xs font-mono font-medium focus:outline-none transition-colors ${
                    isFreezeActive
                      ? "border-cyan-500/80 text-cyan-500 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF4F00]"
                  }`}
                >
                  <option value="0">Off (Normal Daily Tracking)</option>
                  <option value="1">❄️ Freeze 1 Day (Today)</option>
                  <option value="2">❄️ Freeze 2 Days</option>
                  <option value="3">❄️ Freeze 3 Days (Weekend / Trip)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Daily Focus Reminder (Browser Push Notification) */}
            <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Focus Reminder</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderActive}
                    onChange={(e) => handleToggleReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF4F00]" />
                </label>
              </div>

              {reminderActive && (
                <div className="mt-2.5 animate-fade-in">
                  {/* 12-Hour Time Picker with AM / PM */}
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      {/* Hour Select */}
                      <div className="relative">
                        <select
                          value={reminderHour}
                          onChange={(e) => handleTimeChange(e.target.value, reminderMinute, reminderPeriod)}
                          aria-label="Hour (12-hour)"
                          className="appearance-none bg-transparent text-sm font-mono font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer pr-3.5"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                            <option key={h} value={h} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                              {h}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-zinc-400">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <span className="text-sm font-mono font-bold text-zinc-400 select-none">:</span>

                      {/* Minute Select */}
                      <div className="relative">
                        <select
                          value={reminderMinute}
                          onChange={(e) => handleTimeChange(reminderHour, e.target.value, reminderPeriod)}
                          aria-label="Minute"
                          className="appearance-none bg-transparent text-sm font-mono font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer pr-3.5"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                            <option key={m} value={m} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-zinc-400">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* AM / PM Segmented Toggle Buttons */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200/60 dark:border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleTimeChange(reminderHour, reminderMinute, "AM")}
                        className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                          reminderPeriod === "AM"
                            ? "bg-[#FF4F00] text-white shadow-xs"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(reminderHour, reminderMinute, "PM")}
                        className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                          reminderPeriod === "PM"
                            ? "bg-[#FF4F00] text-white shadow-xs"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Data Management & Backup */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
              <label
                htmlFor="data-action-select"
                className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-800 dark:text-zinc-200"
              >
                Data Management
              </label>
            </div>

            {/* Quick 1-Click Backup Export & Import */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                title="Download JSON backup"
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[#FF4F00] text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#FF4F00]" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload JSON backup"
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[#FF4F00] text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF4F00]" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Secondary Action Dropdown (Restore / Clear) */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <div className="relative flex-1 min-w-0">
                <select
                  id="data-action-select"
                  value={dataAction}
                  onChange={(e) => {
                    setDataAction(e.target.value as "restore" | "clear");
                    setConfirmClear(false);
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-medium focus:outline-none focus:border-[#FF4F00] text-zinc-900 dark:text-white"
                >
                  <option value="restore">🔄 Restore Sample Habits</option>
                  <option value="clear">🗑️ Clear All (Start Fresh)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {dataAction === "restore" ? (
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  disabled={isResetting}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isResetting}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 ${
                    confirmClear
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-900 hover:bg-rose-600 hover:text-white active:scale-95"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmClear ? "Confirm?" : "Clear"}</span>
                </button>
              )}
            </div>

            {confirmClear && dataAction === "clear" && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-[11px] font-mono text-rose-600 dark:text-rose-400 animate-pop">
                <span>⚠️ Tap &quot;Confirm?&quot; to wipe all data.</span>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-zinc-400 hover:underline ml-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* System Info */}
          <div className="pt-1 px-1 flex items-center justify-center text-[10px] font-mono text-zinc-400">
            <span>KINETIC // v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
