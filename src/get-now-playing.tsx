import { Detail, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useMemo } from "react";
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

export default function GetNowPlayingCommand() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingEntry[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const preferences = getPreferenceValues<Preferences>();
  const { serverUrl, username, password, salt } = preferences;

  // Generate a stable salt for this session if none provided
  const effectiveSalt = useMemo(() => {
    return salt || Math.random().toString(36).substring(7);
  }, [salt]);

  useEffect(() => {
    async function fetchNowPlaying() {
      try {
        setIsLoading(true);
        setError(undefined);

        // Create password token using MD5
        const token = md5(password + effectiveSalt);

        // Initialize Subsonic API
        const subsonic = Subsonic(username, token, effectiveSalt, serverUrl);

        // Get now playing information
        const response: { nowPlaying: NowPlayingResponse } = await subsonic.browsing.getNowPlaying();

        // Filter to only show the logged-in user's now playing song
        const allEntries = response.nowPlaying.entry || [];
        const userEntries = allEntries.filter((entry) => entry.username === username);
        setNowPlaying(userEntries);
      } catch (err) {
        console.error("Error fetching now playing:", err);
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchNowPlaying();
  }, [serverUrl, username, password, effectiveSalt]);

  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch now playing",
        message: error.message,
      });
    }
  }, [error]);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (minutesAgo: number): string => {
    if (minutesAgo === 0) return "Currently playing";
    if (minutesAgo === 1) return "1 minute ago";
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

    const hours = Math.floor(minutesAgo / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  const generateMarkdown = (): string => {
    if (error) {
      return `# Error\n\n❌ Failed to connect to Subsonic server\n\n**Error:** ${error.message}\n\n**Troubleshooting:**\n- Check your server URL, username, and password in preferences\n- Ensure your Subsonic server is running and accessible\n- Verify your network connection`;
    }

    if (!nowPlaying || nowPlaying.length === 0) {
      return "# No Music Playing\n\n🎵 You are not currently listening to music on your Subsonic server.";
    }

    let markdown = "# Now Playing\n\n";

    nowPlaying.forEach((entry, index) => {
      // Since we're only showing the current user, we don't need to display the username as a header
      markdown += `**${entry.title}**\n\n`;

      if (entry.artist) {
        markdown += `🎤 **Artist:** ${entry.artist}\n\n`;
      }

      if (entry.album) {
        markdown += `💿 **Album:** ${entry.album}\n\n`;
      }

      if (entry.duration) {
        markdown += `⏱️ **Duration:** ${formatDuration(entry.duration)}\n\n`;
      }

      markdown += `🕒 **Status:** ${formatTimeAgo(entry.minutesAgo)}\n\n`;

      if (entry.playerName) {
        markdown += `📱 **Player:** ${entry.playerName}\n\n`;
      }

      if (entry.bitRate) {
        markdown += `🎧 **Quality:** ${entry.bitRate} kbps`;
        if (entry.suffix) {
          markdown += ` (${entry.suffix.toUpperCase()})`;
        }
        markdown += "\n\n";
      }

      if (index < nowPlaying.length - 1) {
        markdown += "---\n\n";
      }
    });

    return markdown;
  };

  return (
    <Detail
      isLoading={isLoading}
      markdown={generateMarkdown()}
      metadata={
        nowPlaying && nowPlaying.length > 0 ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="User" text={username} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label title="Server" text={serverUrl} />
          </Detail.Metadata>
        ) : undefined
      }
    />
  );
}
