# Joystick

A Raycast extension for interacting with your Subsonic music server.

## Features

- **Get Now Playing**: View your currently playing song on your Subsonic server

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