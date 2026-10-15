#!/usr/bin/env node
/**
 * One-time script to get a new Spotify refresh token.
 * Run with: node get-refresh-token.js
 *
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in a .env file
 * or as environment variables.
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:8080/callback';
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const PORT = 8080;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set.');
    process.exit(1);
}

const authUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
    });

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
    }

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error || !code) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Authorization failed: ${error || 'no code returned'}`);
        server.close();
        return;
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
    }).toString();

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const options = {
        hostname: 'accounts.spotify.com',
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
            'Content-Length': Buffer.byteLength(body),
        },
    };

    const tokenReq = https.request(options, (tokenRes) => {
        let data = '';
        tokenRes.on('data', (chunk) => (data += chunk));
        tokenRes.on('end', () => {
            const json = JSON.parse(data);

            if (json.error) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(`Token exchange failed: ${json.error} — ${json.error_description}`);
                server.close();
                return;
            }

            console.log('\n✓ Success!\n');
            console.log('Your new refresh token:');
            console.log('\n  ' + json.refresh_token + '\n');
            console.log('Update your Vercel environment variable:');
            console.log('  vercel env rm REFRESH_TOKEN production');
            console.log('  vercel env add REFRESH_TOKEN production\n');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h2>Success!</h2><p>You can close this tab. Check your terminal for the refresh token.</p>');
            server.close();
        });
    });

    tokenReq.on('error', (e) => {
        console.error('Token request failed:', e);
        server.close();
    });

    tokenReq.write(body);
    tokenReq.end();
});

server.listen(PORT, () => {
    console.log('Opening Spotify authorization page...');
    console.log('If it does not open automatically, visit:\n  ' + authUrl + '\n');

    try {
        execSync(`open "${authUrl}"`);
    } catch {
        // non-mac fallback — just print the URL
    }
});
