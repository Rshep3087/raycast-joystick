import { showHUD, getPreferenceValues, showToast, Toast } from "@raycast/api";
import md5 from "md5";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Subsonic = require("subsonicjs");

interface Preferences {
  serverUrl: string;
  username: string;
  password: string;
  salt?: string;
}

interface NowPlayingEntry {
  username: string;
  minutesAgo: number;
  playerId: number;
  playerName?: string;
  id: string;
  parent?: string;
  title: string;
  album?: string;
  artist?: string;
  isDir: boolean;
  coverArt?: string;
  created?: string;
  duration?: number;
  bitRate?: number;
  size?: number;
  suffix?: string;
  contentType?: string;
  isVideo?: boolean;
  path?: string;
  albumId?: string;
  artistId?: string;
  type?: string;
  bookmarkPosition?: number;
  originalWidth?: number;
  originalHeight?: number;
}

interface NowPlayingResponse {
  entry?: NowPlayingEntry[];
}

interface JukeboxStatus {
  currentIndex?: number;
  playing: boolean;
  gain: number;
  position?: number;
}

export default async function main() {
  try {
    const preferences = getPreferenceValues<Preferences>();

    // Generate salt if not provided
    const salt = preferences.salt || Math.random().toString(36).substring(7);

    // Create password token using MD5
    const token = md5(preferences.password + salt);

    // Initialize Subsonic API
    const subsonic = Subsonic(preferences.username, token, salt, preferences.serverUrl);

    // Try to get jukebox status first (requires API version 1.7.0+)
    let jukeboxStatus: { jukeboxStatus?: JukeboxStatus } | null = null;
    try {
      jukeboxStatus = await subsonic.jukeboxControl.jukeboxControl({ action: "status" });
    } catch {
      // If status is not supported, fall back to checking now playing
      console.log("Jukebox status not supported, falling back to now playing check");

      const nowPlayingResponse: { nowPlaying: NowPlayingResponse } = await subsonic.browsing.getNowPlaying();
      const allEntries = nowPlayingResponse.nowPlaying.entry || [];
      const userEntries = allEntries.filter((entry) => entry.username === preferences.username);

      if (userEntries.length === 0 || !userEntries.some((entry) => entry.minutesAgo === 0)) {
        await showHUD("❌ No song currently playing to pause");
        return;
      }
    }

    // If we got jukebox status, check if it's playing
    if (jukeboxStatus && jukeboxStatus.jukeboxStatus && !jukeboxStatus.jukeboxStatus.playing) {
      await showHUD("❌ No song currently playing to pause");
      return;
    }

    // Stop the jukebox (this pauses/stops current playback)
    await subsonic.jukeboxControl.jukeboxControl({ action: "stop" });

    await showHUD("⏸️ Paused current song");
  } catch (error) {
    console.error("Error pausing song:", error);

    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to pause song",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
