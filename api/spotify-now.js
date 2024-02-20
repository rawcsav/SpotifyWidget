// /api/auth.js
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize SpotifyWebApi with the specific redirectUri
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'https://rawcsav.com/callback',
      refreshToken: process.env.REFRESH_TOKEN, // Add this line
});

module.exports = async (req, res) => {
    if (req.query.code) {
        try {
            // Exchange code for tokens
            const data = await spotifyApi.authorizationCodeGrant(req.query.code);
            const { access_token, refresh_token, expires_in } = data.body;
            spotifyApi.setAccessToken(access_token);

            // Optionally, refresh the token automatically when it expires
            setTimeout(refreshAccessToken, expires_in * 1000 - 60000, spotifyApi);

            // Fetch track information as an example of using the access token
            const currentTrack = await spotifyApi.getMyCurrentPlayingTrack();
            if (currentTrack.body && currentTrack.body.is_playing) {
                const trackInfo = {
                    artist: currentTrack.body.item.artists.map(artist => artist.name).join(", "),
                    track_name: currentTrack.body.item.name,
                    playing: true
                };
                return res.json(trackInfo);
            } else {
                return res.json({ error: 'No track information available or not playing' });
            }
        } catch (error) {
            console.error('Error during authentication or fetching data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // Redirect to Spotify's authorization page
        const scopes = ['user-read-currently-playing', 'user-read-recently-played'];
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
        return res.redirect(authorizeURL);
    }
};

async function refreshAccessToken(spotifyApi) {
    try {
        const data = await spotifyApi.refreshAccessToken();
        const { access_token, expires_in } = data.body;
        spotifyApi.setAccessToken(access_token);
        // Schedule the next refresh
        setTimeout(refreshAccessToken, expires_in * 1000 - 60000, spotifyApi);
    } catch (error) {
        console.error('Could not refresh access token', error);
    }
}