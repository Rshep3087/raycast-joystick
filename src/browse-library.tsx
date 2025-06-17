import { List, ActionPanel, Action, getPreferenceValues, showToast, Toast, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import md5 from "md5";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Subsonic = require("subsonicjs");

interface Preferences {
  serverUrl: string;
  username: string;
  password: string;
  salt?: string;
}

interface Artist {
  id: string;
  name: string;
  albumCount?: number;
  starred?: string;
}

interface Album {
  id: string;
  name: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount?: number;
  duration?: number;
  created?: string;
  year?: number;
  genre?: string;
}

interface Song {
  id: string;
  title: string;
  album?: string;
  albumId?: string;
  artist?: string;
  artistId?: string;
  track?: number;
  year?: number;
  genre?: string;
  size?: number;
  duration?: number;
  bitRate?: number;
  suffix?: string;
  contentType?: string;
  path?: string;
  coverArt?: string;
}

type ViewMode = "artists" | "albums" | "songs";

interface NavigationState {
  mode: ViewMode;
  selectedArtist?: Artist;
  selectedAlbum?: Album;
}

export default function BrowseLibraryCommand() {
  const [navigationState, setNavigationState] = useState<NavigationState>({ mode: "artists" });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const preferences = getPreferenceValues<Preferences>();

  // Create subsonic instance
  const createSubsonicInstance = () => {
    const salt = preferences.salt || Math.random().toString(36).substring(7);
    const token = md5(preferences.password + salt);
    return Subsonic(preferences.username, token, salt, preferences.serverUrl);
  };

  // Fetch artists
  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      const subsonic = createSubsonicInstance();
      const response = await subsonic.browsing.getArtists();

      const artistList: Artist[] = [];

      // Handle different response structures
      if (response.artists?.index) {
        // Handle indexed artists structure
        response.artists.index.forEach((indexGroup: { artist?: Artist | Artist[] }) => {
          if (indexGroup.artist) {
            const groupArtists = Array.isArray(indexGroup.artist) ? indexGroup.artist : [indexGroup.artist];
            artistList.push(...groupArtists);
          }
        });
      } else if (response.artists?.artist) {
        // Handle direct artist array
        const directArtists = Array.isArray(response.artists.artist)
          ? response.artists.artist
          : [response.artists.artist];
        artistList.push(...directArtists);
      }

      setArtists(artistList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Error fetching artists:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch artists"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch albums for an artist
  const fetchAlbums = async (artistId: string) => {
    try {
      setIsLoading(true);
      setError(undefined);

      const subsonic = createSubsonicInstance();
      const response = await subsonic.browsing.getAlbumList2({ type: "byArtist", size: 500 });

      let albumList: Album[] = [];

      if (response.albumList2?.album) {
        const allAlbums = Array.isArray(response.albumList2.album)
          ? response.albumList2.album
          : [response.albumList2.album];
        // Filter albums by artist ID
        albumList = allAlbums.filter((album: Album) => album.artistId === artistId);
      }

      setAlbums(
        albumList.sort((a, b) => {
          // Sort by year if available, then by name
          if (a.year && b.year) {
            return a.year - b.year;
          }
          return a.name.localeCompare(b.name);
        }),
      );
    } catch (err) {
      console.error("Error fetching albums:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch albums"));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch songs for an album
  const fetchSongs = async (albumId: string) => {
    try {
      setIsLoading(true);
      setError(undefined);

      const subsonic = createSubsonicInstance();
      const response = await subsonic.browsing.getAlbum({ id: albumId });

      let songList: Song[] = [];

      if (response.album?.song) {
        songList = Array.isArray(response.album.song) ? response.album.song : [response.album.song];
      }

      setSongs(
        songList.sort((a, b) => {
          // Sort by track number if available, then by title
          if (a.track && b.track) {
            return a.track - b.track;
          }
          return a.title.localeCompare(b.title);
        }),
      );
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch songs"));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate stream URL for a song
  const generateStreamUrl = (songId: string): string => {
    const salt = preferences.salt || Math.random().toString(36).substring(7);
    const token = md5(preferences.password + salt);
    return `${preferences.serverUrl}/rest/stream?id=${songId}&u=${preferences.username}&t=${token}&s=${salt}&v=1.16.1&c=Joystick`;
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return "--";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Load data based on current navigation state
  useEffect(() => {
    if (navigationState.mode === "artists") {
      fetchArtists();
    } else if (navigationState.mode === "albums" && navigationState.selectedArtist) {
      fetchAlbums(navigationState.selectedArtist.id);
    } else if (navigationState.mode === "songs" && navigationState.selectedAlbum) {
      fetchSongs(navigationState.selectedAlbum.id);
    }
  }, [navigationState]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error.message,
      });
    }
  }, [error]);

  // Navigate to albums for an artist
  const navigateToArtistAlbums = (artist: Artist) => {
    setNavigationState({
      mode: "albums",
      selectedArtist: artist,
    });
  };

  // Navigate to songs for an album
  const navigateToAlbumSongs = (album: Album) => {
    setNavigationState({
      mode: "songs",
      selectedArtist: navigationState.selectedArtist,
      selectedAlbum: album,
    });
  };

  // Navigate back
  const navigateBack = () => {
    if (navigationState.mode === "songs") {
      setNavigationState({
        mode: "albums",
        selectedArtist: navigationState.selectedArtist,
      });
    } else if (navigationState.mode === "albums") {
      setNavigationState({ mode: "artists" });
    }
  };

  // Get navigation title
  const getNavigationTitle = (): string => {
    if (navigationState.mode === "artists") {
      return "Browse Artists";
    } else if (navigationState.mode === "albums") {
      return `Albums by ${navigationState.selectedArtist?.name || "Unknown Artist"}`;
    } else if (navigationState.mode === "songs") {
      return `${navigationState.selectedAlbum?.name || "Unknown Album"}`;
    }
    return "Browse Library";
  };

  return (
    <List
      isLoading={isLoading}
      navigationTitle={getNavigationTitle()}
      searchBarPlaceholder={`Search ${navigationState.mode}...`}
    >
      {/* Back navigation */}
      {navigationState.mode !== "artists" && (
        <List.Item
          title="← Back"
          icon={Icon.ArrowLeft}
          actions={
            <ActionPanel>
              <Action title="Go Back" onAction={navigateBack} />
            </ActionPanel>
          }
        />
      )}

      {/* Artists view */}
      {navigationState.mode === "artists" &&
        artists.map((artist) => (
          <List.Item
            key={artist.id}
            title={artist.name}
            subtitle={artist.albumCount ? `${artist.albumCount} albums` : undefined}
            icon={Icon.Person}
            actions={
              <ActionPanel>
                <Action title="View Albums" onAction={() => navigateToArtistAlbums(artist)} />
                <Action.CopyToClipboard
                  title="Copy Artist Name"
                  content={artist.name}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        ))}

      {/* Albums view */}
      {navigationState.mode === "albums" &&
        albums.map((album) => (
          <List.Item
            key={album.id}
            title={album.name}
            subtitle={`${album.year || "Unknown year"}${album.songCount ? ` • ${album.songCount} songs` : ""}${album.duration ? ` • ${formatDuration(album.duration)}` : ""}`}
            icon={Icon.Music}
            actions={
              <ActionPanel>
                <Action title="View Songs" onAction={() => navigateToAlbumSongs(album)} />
                <Action.CopyToClipboard
                  title="Copy Album Name"
                  content={album.name}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        ))}

      {/* Songs view */}
      {navigationState.mode === "songs" &&
        songs.map((song) => {
          const streamUrl = generateStreamUrl(song.id);
          return (
            <List.Item
              key={song.id}
              title={song.title}
              subtitle={`${song.track ? `${song.track}. ` : ""}${formatDuration(song.duration)}${song.bitRate ? ` • ${song.bitRate} kbps` : ""}${song.suffix ? ` • ${song.suffix.toUpperCase()}` : ""}`}
              icon={Icon.Music}
              accessories={[{ text: formatSize(song.size) }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Stream URL"
                    content={streamUrl}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.OpenInBrowser
                    title="Open Stream URL"
                    url={streamUrl}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Song Title"
                    content={song.title}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          );
        })}

      {/* Empty states */}
      {!isLoading && navigationState.mode === "artists" && artists.length === 0 && (
        <List.EmptyView
          title="No Artists Found"
          description="Your music library appears to be empty or there was an error loading artists."
          icon={Icon.MusicNote}
        />
      )}

      {!isLoading && navigationState.mode === "albums" && albums.length === 0 && (
        <List.EmptyView
          title="No Albums Found"
          description={`No albums found for ${navigationState.selectedArtist?.name || "this artist"}.`}
          icon={Icon.Music}
        />
      )}

      {!isLoading && navigationState.mode === "songs" && songs.length === 0 && (
        <List.EmptyView
          title="No Songs Found"
          description={`No songs found in ${navigationState.selectedAlbum?.name || "this album"}.`}
          icon={Icon.Music}
        />
      )}
    </List>
  );
}
