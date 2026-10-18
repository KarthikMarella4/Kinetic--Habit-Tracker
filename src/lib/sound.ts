// Web Audio API Synthesizer & Haptic Feedback for Focus Session Completion
// Runs 100% locally with zero external audio assets or network requests.

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (_) {
    return null;
  }
}

// Warm up audio context on user gesture (e.g. clicking Start, dropping down, or Fast-Finish)
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  } catch (_) {}
}

// Automatically listen for first user interaction to unlock audio
if (typeof window !== "undefined") {
  const handleFirstInteraction = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", handleFirstInteraction);
    window.removeEventListener("keydown", handleFirstInteraction);
  };
  window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
  window.addEventListener("keydown", handleFirstInteraction, { once: true });
}

function doPlayChime(ctx: AudioContext) {
  try {
    // Schedule 50ms in the future to ensure audio thread renders without dropping initial transients
    const startTime = ctx.currentTime + 0.05;

    // Harmonic celebration chord: D5 (587Hz) -> A5 (880Hz) -> D6 (1175Hz)
    // Triangle wave creates bright, crisp bell-like harmonics audible on all speakers
    const notes = [
      { freq: 587.33, time: 0, duration: 0.4, gain: 0.65 },
      { freq: 880.0, time: 0.14, duration: 0.5, gain: 0.75 },
      { freq: 1174.66, time: 0.28, duration: 0.9, gain: 0.85 },
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime + time);

      gainNode.gain.setValueAtTime(gain, startTime + time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime + time);
      osc.stop(startTime + time + duration);
    });
  } catch (err) {
    console.warn("Chime playback error:", err);
  }
}

export function playCompletionChime() {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => doPlayChime(ctx)).catch(() => {
        doPlayChime(ctx);
      });
    } else {
      doPlayChime(ctx);
    }
  } catch (_) {}
}

export function triggerHaptic() {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate([100, 50, 150]);
    }
  } catch (_) {}
}
