const SpotifyWebApi = require('spotify-web-api-node');

module.exports = async (req, res) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });

    const { code } = req.query;

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token } = data.body;

        spotifyApi.setAccessToken(access_token);

        // Fetching the current or most recently played track
        const currentTrack = await spotifyApi.getMyCurrentPlayingTrack();

        if (currentTrack.body && currentTrack.body.is_playing) {
            const trackInfo = {
                artist: currentTrack.body.item.artists.map(artist => artist.name).join(", "),
                track_name: currentTrack.body.item.name,
                playing: true
            };
            res.json(trackInfo);
        } else {
            const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 1 });
            if (recentlyPlayed.body.items.length > 0) {
                const lastPlayed = recentlyPlayed.body.items[0].track;
                const trackInfo = {
                    artist: lastPlayed.artists.map(artist => artist.name).join(", "),
                    track_name: lastPlayed.name,
                    playing: false
                };
                res.json(trackInfo);
            } else {
                res.json({ error: 'No track information available' });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
