import db from '../db.js';
import { nanoid } from 'nanoid';

const OAUTH42_CLIENT_ID = process.env.OAUTH42_CLIENT_ID || '';
const OAUTH42_SECRET = process.env.OAUTH42_SECRET || '';
const OAUTH42_REDIRECT_URI = process.env.OAUTH42_REDIRECT_URI || 'https://localhost:8443/api/auth/oauth/42/callback/';

export default async function oauthRoutes(app) {
  // OAuth 42 - Initiate authentication
  app.get('/api/auth/oauth/42/', async (request, reply) => {
    if (!OAUTH42_CLIENT_ID) {
      return reply.code(503).send({ error: 'OAuth 42 not configured' });
    }

    // Generate state for CSRF protection
    const state = nanoid(32);

    // Store state in session/cookie (simplified version)
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    const authUrl = new URL('https://api.intra.42.fr/oauth/authorize');
    authUrl.searchParams.set('client_id', OAUTH42_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', OAUTH42_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'public');

    reply.redirect(authUrl.toString());
  });

  // OAuth 42 - Callback
  app.get('/api/auth/oauth/42/callback/', async (request, reply) => {
    if (!OAUTH42_CLIENT_ID || !OAUTH42_SECRET) {
      return reply.code(503).send({ error: 'OAuth 42 not configured' });
    }

    const { code, state } = request.query;

    if (!code) {
      return reply.code(400).send({ error: 'Missing authorization code' });
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.oauth_state;
    if (!storedState || storedState !== state) {
      return reply.code(400).send({ error: 'Invalid state parameter' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: OAUTH42_CLIENT_ID,
          client_secret: OAUTH42_SECRET,
          code: code,
          redirect_uri: OAUTH42_REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info from 42 API
      const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(`42_${userData.login}`);

      if (!user) {
        // Create new user
        const stmt = db.prepare(`
          INSERT INTO users (username, email, display_name, password_hash, avatar, is_online)
          VALUES (?, ?, ?, ?, ?, 1)
        `);

        const result = stmt.run(
          `42_${userData.login}`,
          userData.email || `${userData.login}@student.42.fr`,
          userData.displayname || userData.login,
          'oauth_42', // Placeholder password hash for OAuth users
          userData.image?.link || null
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      } else {
        // Update last seen
        db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      }

      // Generate JWT tokens
      const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
      const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      // Clear OAuth state cookie
      reply.clearCookie('oauth_state');

      // Redirect to frontend with tokens
      const frontendUrl = new URL('https://localhost:8443/');
      frontendUrl.searchParams.set('access_token', accessToken);
      frontendUrl.searchParams.set('refresh_token', refreshToken);

      reply.redirect(frontendUrl.toString());
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'OAuth authentication failed', details: error.message });
    }
  });

  // GitHub OAuth (optional alternative)
  app.get('/api/auth/oauth/github/', async (request, reply) => {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';

    if (!GITHUB_CLIENT_ID) {
      return reply.code(503).send({ error: 'GitHub OAuth not configured' });
    }

    const state = nanoid(32);
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600
    });

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.GITHUB_REDIRECT_URI || 'https://localhost:8443/api/auth/oauth/github/callback/');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'read:user user:email');

    reply.redirect(authUrl.toString());
  });

  app.get('/api/auth/oauth/github/callback/', async (request, reply) => {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return reply.code(503).send({ error: 'GitHub OAuth not configured' });
    }

    const { code, state } = request.query;

    if (!code) {
      return reply.code(400).send({ error: 'Missing authorization code' });
    }

    const storedState = request.cookies.oauth_state;
    if (!storedState || storedState !== state) {
      return reply.code(400).send({ error: 'Invalid state parameter' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(`gh_${userData.login}`);

      if (!user) {
        const stmt = db.prepare(`
          INSERT INTO users (username, email, display_name, password_hash, avatar, is_online)
          VALUES (?, ?, ?, ?, ?, 1)
        `);

        const result = stmt.run(
          `gh_${userData.login}`,
          userData.email || `${userData.login}@github.com`,
          userData.name || userData.login,
          'oauth_github',
          userData.avatar_url || null
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      } else {
        db.prepare('UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      }

      // Generate JWT tokens
      const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
      const refreshToken = app.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      reply.clearCookie('oauth_state');

      const frontendUrl = new URL('https://localhost:8443/');
      frontendUrl.searchParams.set('access_token', accessToken);
      frontendUrl.searchParams.set('refresh_token', refreshToken);

      reply.redirect(frontendUrl.toString());
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'OAuth authentication failed', details: error.message });
    }
  });
}
