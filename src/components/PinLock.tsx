"use client";

import { useState, useEffect, useCallback } from "react";

const PIN_STORAGE_KEY = "kinetic_pin";
const SESSION_KEY = "kinetic_unlocked";
const DEFAULT_PIN = "0024";

/** Read the saved PIN (or fall back to default) */
export function getSavedPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

/** Save a new PIN */
export function setSavedPin(newPin: string) {
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
}

// ─── Landing Page ────────────────────────────────────────────────

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden select-none">
      {/* Subtle background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundSize: "20px 20px",
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)",
          }}
        />
        {/* Soft orange glow behind logo */}
        <div
          className="absolute top-[30%] left-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(255,79,0,0.06) 0%, transparent 70%)",
            animation: "pulseGlow 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div
        className={`relative flex flex-col items-center gap-7 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Logo Image */}
        <div className="relative">
          <div className="w-24 h-24 rounded-[28px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-zinc-100">
            <img
              src="/icon-512.jpg"
              alt="KINETIC Logo"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Subtle ring */}
          <div
            className="absolute -inset-2.5 rounded-[34px] border border-[#FF4F00]/15"
            style={{ animation: "pulseGlow 3s ease-in-out infinite" }}
          />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold text-zinc-900 tracking-tight"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            KINETIC
          </h1>
          <p className="text-[11px] text-zinc-400 mt-1.5 font-mono uppercase tracking-[0.2em]">
            Precision Habit Tracking
          </p>
        </div>

        {/* Tagline */}
        <p className="text-zinc-500 text-center text-sm max-w-[260px] leading-relaxed">
          Engineered for focus. Built for consistency. Track your habits with precision.
        </p>

        {/* Enter Button */}
        <button
          onClick={onEnter}
          className="group relative mt-3 px-10 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-zinc-800 hover:shadow-[0_6px_28px_rgba(0,0,0,0.2)] active:scale-[0.97] transition-all duration-200"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <span className="flex items-center gap-2.5">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start Tracking
          </span>
        </button>

        {/* Footer */}
        <p className="text-[10px] font-mono text-zinc-400 tracking-widest mt-4">
          SECURED WITH PIN LOCK
        </p>
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── PIN Entry Screen ────────────────────────────────────────────

function PinEntry({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = useCallback(
    (fullPin: string) => {
      const savedPin = getSavedPin();
      if (fullPin === savedPin) {
        setSuccess(true);
        setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, "true");
          onSuccess();
        }, 600);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setError(false);
          setPin(["", "", "", ""]);
        }, 600);
      }
    },
    [onSuccess]
  );

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (success) return;
      const newPin = [...pin];
      const emptyIndex = newPin.findIndex((d) => d === "");
      if (emptyIndex === -1) return;
      newPin[emptyIndex] = digit;
      setPin(newPin);
      if (emptyIndex === 3) {
        setTimeout(() => handleUnlock(newPin.join("")), 150);
      }
    },
    [pin, success, handleUnlock]
  );

  const handleDelete = useCallback(() => {
    if (success) return;
    const newPin = [...pin];
    const lastFilledIndex = newPin.reduce((acc, d, i) => (d !== "" ? i : acc), -1);
    if (lastFilledIndex >= 0) {
      newPin[lastFilledIndex] = "";
      setPin(newPin);
    }
  }, [pin, success]);

  // Physical keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKeyPress(e.key);
      else if (e.key === "Backspace") handleDelete();
      else if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKeyPress, handleDelete, onBack]);

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0c] overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, #FF4F00 0%, transparent 70%)",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-all active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Lock Icon */}
      <div className={`mb-6 transition-all duration-500 ${success ? "scale-110 opacity-0 -translate-y-5" : ""}`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4F00]/20 to-[#FF4F00]/5 border border-[#FF4F00]/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={error ? "#ef4444" : "#FF4F00"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16.5" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className={`text-center mb-8 transition-all duration-500 ${success ? "opacity-0 -translate-y-5" : ""}`}>
        <h1 className="text-lg font-semibold text-white tracking-wide" style={{ fontFamily: "var(--font-sans)" }}>
          KINETIC
        </h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-[0.2em]">
          Enter Access Code
        </p>
      </div>

      {/* PIN Dots */}
      <div className={`flex gap-5 mb-10 transition-all duration-500 ${shake ? "animate-shake" : ""} ${success ? "opacity-0 scale-90" : ""}`}>
        {pin.map((digit, i) => (
          <div key={i} className="relative flex items-center justify-center">
            <div
              className={`w-[14px] h-[14px] rounded-full border-2 transition-all duration-200 ${
                error
                  ? "border-red-500 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : digit
                  ? "border-[#FF4F00] bg-[#FF4F00] shadow-[0_0_12px_rgba(255,79,0,0.35)]"
                  : "border-zinc-600 bg-transparent"
              }`}
            />
            {digit && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[14px] h-[14px] rounded-full bg-[#FF4F00] animate-ping opacity-20" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className={`grid grid-cols-3 gap-3 w-[280px] transition-all duration-500 ${success ? "opacity-0 scale-90 translate-y-5" : ""}`}>
        {keys.flat().map((key, i) => {
          if (key === "") return <div key={i} />;
          if (key === "del") {
            return (
              <button key={i} onClick={handleDelete} className="h-[64px] rounded-2xl flex items-center justify-center text-zinc-400 active:bg-white/5 transition-all duration-150 active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleKeyPress(key)}
              className="h-[64px] rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white text-2xl font-light flex items-center justify-center hover:bg-white/[0.08] active:bg-[#FF4F00]/20 active:border-[#FF4F00]/30 active:scale-95 transition-all duration-150 backdrop-blur-sm"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Error text */}
      <div className="h-6 mt-6">
        {error && (
          <p className="text-red-400 text-xs font-mono uppercase tracking-widest animate-pop">
            Incorrect Code
          </p>
        )}
      </div>

      {/* Success overlay */}
      {success && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 animate-pop">
            <div className="w-16 h-16 rounded-full bg-[#FF4F00]/10 border border-[#FF4F00]/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4F00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#FF4F00] text-xs font-mono uppercase tracking-[0.25em]">
              Access Granted
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.05; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.12; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ─── Main PinLock Wrapper ────────────────────────────────────────

type LockView = "landing" | "pin" | "unlocked";

export default function PinLock({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<LockView | null>(null); // null = loading

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem(SESSION_KEY) === "true";
    setView(isUnlocked ? "unlocked" : "landing");
  }, []);

  if (view === null) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] z-[9999] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "unlocked") return <>{children}</>;

  if (view === "pin") {
    return (
      <PinEntry
        onSuccess={() => setView("unlocked")}
        onBack={() => setView("landing")}
      />
    );
  }

  return <LandingPage onEnter={() => setView("pin")} />;
}
