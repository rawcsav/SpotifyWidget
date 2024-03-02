const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
});

async function refreshAccessToken() {
    try {
        const data = await spotifyApi.refreshAccessToken();
        const {access_token} = data.body;
        spotifyApi.setAccessToken(access_token);
    } catch (error) {
        console.error('Could not refresh access token', error);
    }
}

async function getTrackInfo() {
    try {
        await refreshAccessToken();
        const currentTrack = await spotifyApi.getMyCurrentPlayingTrack();

        if (currentTrack.body && currentTrack.body.is_playing) {
            const trackInfo = {
                artist: currentTrack.body.item.artists.map((artist) => artist.name).join(', '),
                track_name: currentTrack.body.item.name,
                album_cover: currentTrack.body.item.album.images[0].url,
                song_url: `https://open.spotify.com/track/${currentTrack.body.item.id}`,
                playing: true,
                track_id: currentTrack.body.item.id, // Store the track ID
            };
            return trackInfo;
        } else {
            const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({limit: 1});

            if (recentlyPlayed.body && recentlyPlayed.body.items.length > 0) {
                const lastTrack = recentlyPlayed.body.items[0].track;
                const trackInfo = {
                    artist: lastTrack.artists.map(artist => artist.name).join(', '),
                    track_name: lastTrack.name,
                    album_cover: lastTrack.album.images[0].url,
                    song_url: `https://open.spotify.com/track/${lastTrack.id}`,
                    playing: false,
                    track_id: lastTrack.id, // Store the track ID
                };
                return trackInfo;
            } else {
                throw new Error('No track information available or not playing');
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

module.exports = async (req, res) => {
    try {
        // Check the Origin header of the request
        const origin = req.headers.origin;

        // Allow CORS requests only from localhost and rawcsav.com
        if (origin && (origin.includes('localhost') || origin.includes('rawcsav.com'))) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        const trackInfo = await getTrackInfo();
        res.json(trackInfo);
    } catch (error) {
        res.status(500).json({error: 'Internal Server Error'});
    }
};