"use client";

import { useState, useEffect } from "react";
import { useHabits } from "./HabitsProvider";
import { X, User, RotateCcw, Trash2, Check, ShieldAlert } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { userName, setUserName, seedDemo, clearAllData, showToast } = useHabits();
  const [nameInput, setNameInput] = useState(userName);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setNameInput(userName);
    setConfirmClear(false);
  }, [userName, isOpen]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setUserName(nameInput.trim());
    showToast("Profile Name Updated");
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
      <div className="w-full max-w-[420px] bg-white dark:bg-[#151619] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-pop max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] transition-colors">
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

        <div className="space-y-5 mt-4">
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
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
              This name is displayed in the main protocol dashboard header.
            </p>
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                id="user-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-3.5 py-2 text-sm font-medium rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF4F00]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          </div>

          {/* Section 2: Data Management & Reset */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-[#FF4F00]" />
              <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-zinc-800 dark:text-zinc-200">
                Data Management
              </h4>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3.5 leading-relaxed">
              All habits and daily streaks are saved locally on your device.
            </p>

            <div className="space-y-2.5">
              {/* Option A: Restore Demo Habits */}
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={isResetting}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-[#FF4F00] bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:text-[#FF4F00] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between transition-colors disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Sample Habits</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">5 protocols</span>
              </button>

              {/* Option B: Wipe All Data / Start 100% Fresh */}
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isResetting}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between transition-all disabled:opacity-50 ${
                  confirmClear
                    ? "bg-rose-600 text-white border-rose-600 shadow-md animate-pulse"
                    : "border-rose-300/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmClear ? "Confirm Wipe All Data?" : "Clear All (Start Fresh)"}</span>
                </span>
                <span className="text-[10px] opacity-80 font-normal">
                  {confirmClear ? "Tap to Confirm" : "0 habits"}
                </span>
              </button>

              {confirmClear && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="w-full text-center text-[10px] font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 pt-1"
                >
                  Cancel wipe
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Engine & System Info */}
          <div className="pt-1 px-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>KINETIC // v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
