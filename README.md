## API Endpoint
Script to setup API for my personal website that can be accessed to retrieve current/recently played Spotify track information. It responds to requests with a JSON object containing the track's artist(s), name, album cover URL, Spotify URL(s) for the artist(s), a flag indicating if the track is currently playing, and the track ID.

### Response Example
```json
{
  "artist": "Artist 1 Name, Artist 2 Name",
  "artist_urls": [
    "https://open.spotify.com/artist/artist1",
    "https://open.spotify.com/artist/artist2"
  ],
  "track_name": "Track Name",
  "album_cover": "Album Cover URL",
  "song_url": "Spotify Track URL",
  "playing": true,
  "track_id": "Spotify Track ID"
}

### CORS Policy
By default, the script allows CORS requests from `localhost` and my site `rawcsav.com`. Modify the script as needed to allow different origins.