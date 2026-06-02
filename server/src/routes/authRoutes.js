import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { buildProfilePayload } from '../utils/profile.js';
import { createToken, publicUser } from '../utils/token.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account already exists for this email' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const profile = buildProfilePayload(req.body);
    const user = await User.create({
      name,
      email,
      passwordHash,
      authProviders: ['local'],
      ...profile
    });

    res.status(201).json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google sign-in is not configured on the server' });
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ message: 'Unable to read Google account email' });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        authProviders: ['google'],
        isOnboarded: false
      });
    } else {
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
      }
      user.googleId = user.googleId || payload.sub;
      await user.save();
    }

    res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Google sign-in verification error:', error);
    const authError = new Error('Google sign-in failed. Check that this domain is allowed for the Google OAuth client.');
    authError.status = 401;
    next(authError);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const profile = buildProfilePayload(req.body);
    Object.assign(req.user, profile);
    await req.user.save();

    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

export default router;
