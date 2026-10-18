// Web Audio API Synthesizer & Sound Profile Selector for Focus Session Completion
// Runs 100% locally with zero external audio assets or network requests.

export type SoundProfile = "swiss" | "zen" | "fanfare" | "melody" | "pulse" | "mute";

export interface SoundOption {
  id: SoundProfile;
  name: string;
  desc: string;
  icon: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: "swiss",
    name: "Swiss Crystal Chime",
    desc: "Bright 3-note ascending bell (Apple Watch style)",
    icon: "🔔",
  },
  {
    id: "zen",
    name: "Deep Zen Singing Bowl",
    desc: "Calming resonant meditation gong (Headspace style)",
    icon: "🧘",
  },
  {
    id: "fanfare",
    name: "Victory Fanfare",
    desc: "Upbeat 4-tone arcade victory arpeggio",
    icon: "🎺",
  },
  {
    id: "melody",
    name: "Uplifting Melodic Resolution",
    desc: "Harmonic 5-note celebratory chord cadence",
    icon: "🎵",
  },
  {
    id: "pulse",
    name: "Minimalist Dual Pulse",
    desc: "Modern double ping with haptic buzz",
    icon: "⚡",
  },
  {
    id: "mute",
    name: "Mute",
    desc: "Silent (device haptic vibration only)",
    icon: "🔕",
  },
];

const SOUND_STORAGE_KEY = "kinetic_completion_sound_v1";

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

// Warm up audio context on user gesture
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

const SOUND_VOLUME_KEY = "kinetic_completion_volume_v1";

export function getSavedSoundProfile(): SoundProfile {
  if (typeof window === "undefined") return "swiss";
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY) as SoundProfile;
    if (saved && ["swiss", "zen", "fanfare", "melody", "pulse", "mute"].includes(saved)) {
      return saved;
    }
  } catch (_) {}
  return "swiss";
}

export function setSavedSoundProfile(profile: SoundProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, profile);
  } catch (_) {}
}

export function getSavedSoundVolume(): number {
  if (typeof window === "undefined") return 0.8;
  try {
    const saved = localStorage.getItem(SOUND_VOLUME_KEY);
    if (saved !== null) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val >= 0 && val <= 1) {
        return val;
      }
    }
  } catch (_) {}
  return 0.8;
}

export function setSavedSoundVolume(vol: number): void {
  if (typeof window === "undefined") return;
  try {
    const clamped = Math.max(0, Math.min(1, vol));
    localStorage.setItem(SOUND_VOLUME_KEY, clamped.toString());
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

// 1. Swiss Crystal Chime (3-note ascending bell)
function synthSwissChime(ctx: AudioContext, destination: AudioNode = ctx.destination) {
  const startTime = ctx.currentTime + 0.05;
  const notes = [
    { freq: 587.33, time: 0, duration: 0.45, gain: 0.65 }, // D5
    { freq: 880.0, time: 0.14, duration: 0.55, gain: 0.75 }, // A5
    { freq: 1174.66, time: 0.28, duration: 0.95, gain: 0.85 }, // D6
  ];

  notes.forEach(({ freq, time, duration, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime + time);

    gainNode.gain.setValueAtTime(gain, startTime + time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime + time);
    osc.stop(startTime + time + duration);
  });
}

// 2. Deep Zen Singing Bowl (warm resonant gong)
function synthZenBowl(ctx: AudioContext, destination: AudioNode = ctx.destination) {
  const startTime = ctx.currentTime + 0.05;
  // Fundamental F3 (174.6Hz) + C4 (261.6Hz) + harmonic overtone
  const frequencies = [
    { freq: 174.61, gain: 0.85, duration: 2.6, type: "sine" as OscillatorType },
    { freq: 261.63, gain: 0.65, duration: 2.4, type: "triangle" as OscillatorType },
    { freq: 523.25, gain: 0.35, duration: 1.8, type: "sine" as OscillatorType },
  ];

  frequencies.forEach(({ freq, gain, duration, type }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

// 3. Victory Fanfare (4-note ascending arcade arpeggio)
function synthFanfare(ctx: AudioContext, destination: AudioNode = ctx.destination) {
  const startTime = ctx.currentTime + 0.05;
  const notes = [
    { freq: 523.25, time: 0, duration: 0.16, gain: 0.65 }, // C5
    { freq: 659.25, time: 0.11, duration: 0.16, gain: 0.7 }, // E5
    { freq: 783.99, time: 0.22, duration: 0.18, gain: 0.75 }, // G5
    { freq: 1046.5, time: 0.34, duration: 0.7, gain: 0.85 }, // C6
  ];

  notes.forEach(({ freq, time, duration, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime + time);

    gainNode.gain.setValueAtTime(gain, startTime + time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime + time);
    osc.stop(startTime + time + duration);
  });
}

// 4. Minimalist Dual Pulse (double electronic ping)
function synthPulse(ctx: AudioContext, destination: AudioNode = ctx.destination) {
  const startTime = ctx.currentTime + 0.05;
  const pulses = [
    { freq: 880.0, time: 0, duration: 0.12, gain: 0.7 },
    { freq: 880.0, time: 0.14, duration: 0.25, gain: 0.8 },
  ];

  pulses.forEach(({ freq, time, duration, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime + time);

    gainNode.gain.setValueAtTime(gain, startTime + time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime + time);
    osc.stop(startTime + time + duration);
  });
}

// 5. Melodic Song / Uplifting Chime (5-note harmonic cadence)
function synthMelody(ctx: AudioContext, destination: AudioNode = ctx.destination) {
  const startTime = ctx.currentTime + 0.05;
  const notes = [
    { freq: 440.0, time: 0, duration: 0.18, gain: 0.55 }, // A4
    { freq: 554.37, time: 0.11, duration: 0.2, gain: 0.6 }, // C#5
    { freq: 659.25, time: 0.22, duration: 0.22, gain: 0.65 }, // E5
    { freq: 880.0, time: 0.35, duration: 0.3, gain: 0.75 }, // A5
    { freq: 1108.73, time: 0.5, duration: 0.85, gain: 0.8 }, // C#6
  ];

  notes.forEach(({ freq, time, duration, gain }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime + time);

    gainNode.gain.setValueAtTime(gain, startTime + time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + time + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime + time);
    osc.stop(startTime + time + duration);
  });
}

export function playSound(profile?: SoundProfile, volume?: number) {
  if (typeof window === "undefined") return;

  const activeProfile = profile || getSavedSoundProfile();
  triggerHaptic();

  if (activeProfile === "mute") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      const masterGain = ctx.createGain();
      const currentVol = volume !== undefined ? Math.max(0, Math.min(1, volume)) : getSavedSoundVolume();
      masterGain.gain.setValueAtTime(currentVol, ctx.currentTime);
      masterGain.connect(ctx.destination);

      switch (activeProfile) {
        case "zen":
          synthZenBowl(ctx, masterGain);
          break;
        case "fanfare":
          synthFanfare(ctx, masterGain);
          break;
        case "melody":
          synthMelody(ctx, masterGain);
          break;
        case "pulse":
          synthPulse(ctx, masterGain);
          break;
        case "swiss":
        default:
          synthSwissChime(ctx, masterGain);
          break;
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(play).catch(play);
    } else {
      play();
    }
  } catch (err) {
    console.warn("Sound playback error:", err);
  }
}

// Default export wrapper
export function playCompletionChime() {
  playSound();
}
