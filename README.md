# Joystick

A Raycast extension for interacting with your Subsonic music server.

## Features

- **Get Now Playing**: View your currently playing song on your Subsonic server
- **Browse Library**: Browse your music collection by artists, albums, and songs

## Setup

1. Install the extension
2. Open Raycast preferences and configure the Joystick extension with:
   - **Server URL**: Your Subsonic server URL (e.g., `http://localhost:4533` or `https://music.example.com`)
   - **Username**: Your Subsonic username
   - **Password**: Your Subsonic password
   - **Salt** (optional): Custom salt for password hashing (auto-generated if not provided)

## Commands

### Get Now Playing

Displays information about your currently playing song on your Subsonic server, including:

- Song title, artist, and album
- Playback duration and quality
- Time since playback started
- Player information

### Browse Library

Navigate through your music collection with a hierarchical interface:

- **Artists**: Browse all artists in your library with album counts
- **Albums**: View albums by selected artist with year and song count
- **Songs**: Browse tracks within an album with detailed metadata
- **Stream URLs**: Copy or open streaming URLs for any track
- **Rich Metadata**: View duration, bitrate, file format, and file size
- **Search**: Find artists, albums, or songs quickly
- **Keyboard Navigation**: Use shortcuts to copy URLs, titles, or navigate back

## Requirements

- A running Subsonic server (or compatible server like Navidrome, Airsonic, etc.)
- Network access to your Subsonic server
- Valid Subsonic user credentials

## Troubleshooting

If you encounter connection issues:

1. Verify your server URL is correct and accessible
2. Check your username and password
3. Ensure your Subsonic server is running
4. Verify network connectivity to your server
5. Check if your server requires HTTPS