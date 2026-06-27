// New-job alert chime. Isolated behind this one module so the audio library is a
// single-file swap — currently expo-audio (SDK 54's supported replacement for the
// deprecated expo-av). Audio must never crash the feed, so every call is guarded.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const CHIME = require('../assets/sounds/new-job.wav');
const MAX_MS = 3000; // hard cap so the chime never rings longer than ~3s

let player: AudioPlayer | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function getPlayer(): AudioPlayer {
  if (!player) player = createAudioPlayer(CHIME);
  return player;
}

/** Play the new-job chime from the start for ~3 seconds. Safe to call repeatedly. */
export async function playNewJobChime(): Promise<void> {
  try {
    // Drivers work in noisy environments — play even when the device is on silent.
    await setAudioModeAsync({ playsInSilentMode: true });
    const p = getPlayer();
    if (stopTimer) clearTimeout(stopTimer);
    p.seekTo(0);
    p.play();
    stopTimer = setTimeout(() => {
      try {
        p.pause();
        p.seekTo(0);
      } catch {
        // player may have been released — ignore
      }
    }, MAX_MS);
  } catch {
    // missing/blocked audio device must not break the feed
  }
}
