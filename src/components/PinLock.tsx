"use client";

import { useState, useEffect, useCallback } from "react";

const CORRECT_PIN = "0024";
const SESSION_KEY = "kinetic_unlocked";

export default function PinLock({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [unlocked, setUnlocked] = useState<boolean | null>(null); // null = loading
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Check session on mount
  useEffect(() => {
    const isUnlocked = sessionStorage.getItem(SESSION_KEY) === "true";
    setUnlocked(isUnlocked);
  }, []);

  const handleUnlock = useCallback((fullPin: string) => {
    if (fullPin === CORRECT_PIN) {
      setSuccess(true);
      setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, "true");
        setUnlocked(true);
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
  }, []);

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
    const lastFilledIndex = newPin.reduce(
      (acc, d, i) => (d !== "" ? i : acc),
      -1
    );
    if (lastFilledIndex >= 0) {
      newPin[lastFilledIndex] = "";
      setPin(newPin);
    }
  }, [pin, success]);

  // Physical keyboard support
  useEffect(() => {
    if (unlocked) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [unlocked, handleKeyPress, handleDelete]);

  // Still loading session check
  if (unlocked === null) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] z-[9999] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0c] overflow-hidden select-none">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, #FF4F00 0%, transparent 70%)",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Lock Icon */}
      <div
        className={`mb-6 transition-all duration-500 ${
          success
            ? "scale-110 opacity-0 translate-y-[-20px]"
            : "scale-100 opacity-100"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4F00]/20 to-[#FF4F00]/5 border border-[#FF4F00]/20 flex items-center justify-center backdrop-blur-sm">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={error ? "#ef4444" : "#FF4F00"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16.5" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div
        className={`text-center mb-8 transition-all duration-500 ${
          success ? "opacity-0 translate-y-[-20px]" : "opacity-100"
        }`}
      >
        <h1 className="text-lg font-semibold text-white tracking-wide font-[var(--font-sans)]">
          KINETIC
        </h1>
        <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-[0.2em]">
          Enter Access Code
        </p>
      </div>

      {/* PIN Dots */}
      <div
        className={`flex gap-5 mb-10 transition-all duration-500 ${
          shake ? "animate-shake" : ""
        } ${success ? "opacity-0 scale-90" : ""}`}
      >
        {pin.map((digit, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center"
          >
            <div
              className={`w-[14px] h-[14px] rounded-full border-2 transition-all duration-200 ${
                error
                  ? "border-red-500 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : digit
                  ? "border-[#FF4F00] bg-[#FF4F00] shadow-[0_0_12px_rgba(255,79,0,0.35)]"
                  : "border-zinc-600 bg-transparent"
              }`}
            />
            {/* Subtle pulse on fill */}
            {digit && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[14px] h-[14px] rounded-full bg-[#FF4F00] animate-ping opacity-20" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Numeric Keypad */}
      <div
        className={`grid grid-cols-3 gap-3 w-[280px] transition-all duration-500 ${
          success ? "opacity-0 scale-90 translate-y-[20px]" : ""
        }`}
      >
        {keys.flat().map((key, i) => {
          if (key === "") {
            return <div key={i} />;
          }
          if (key === "del") {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="h-[64px] rounded-2xl flex items-center justify-center text-zinc-400 active:bg-white/5 transition-all duration-150 active:scale-95"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF4F00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#FF4F00] text-xs font-mono uppercase tracking-[0.25em]">
              Access Granted
            </p>
          </div>
        </div>
      )}

      {/* Inline Styles for animations */}
      <style jsx>{`
        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.05;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.12;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-12px);
          }
          40% {
            transform: translateX(10px);
          }
          60% {
            transform: translateX(-8px);
          }
          80% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </div>
  );
}
