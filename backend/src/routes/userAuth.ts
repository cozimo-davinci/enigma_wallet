import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import prisma from '../utils/prisma';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_ANON_KEY missing in userAuth.ts');
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}
const supabase = createClient(supabaseUrl, supabaseKey);

interface ErrorResponse {
  error: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Middleware to validate registration input
const validateRegisterInput = (req: Request, res: Response, next: Function) => {
  const { email, username, password }: RegisterRequest = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Username validation (alphanumeric, 3-20 characters)
  const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }

  // Password validation (min 8 characters, at least 1 letter, 1 number, 1 special character)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with at least one letter, one number, and one special character' });
  }

  next();
};

// Register endpoint
router.post('/register', validateRegisterInput, async (req: Request, res: Response) => {
  const { email, username, password }: RegisterRequest = req.body;
  try {
    // Check if username is already taken
    const existingUser = await supabase.from('auth.users').select('id').eq('raw_user_meta_data->>username', username);
    if (existingUser.data && existingUser.data.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('User creation failed');

    await prisma.profile.create({
      data: { userId },
    });

    res.status(201).json({ message: 'User registered successfully', userId, token: data.session?.access_token });
  } catch (error) {
    res.status(400).json({ error: (error as any).message || 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('User not found');

    const profile = await prisma.profile.findUnique({ where: { userId } });
    res.json({
      token: data.session?.access_token,
      user: {
        id: userId,
        email: data.user?.email,
        username: data.user?.user_metadata?.username,
        hasWallet: !!profile?.walletAddresses,
      },
    });
  } catch (error) {
    res.status(401).json({ error: (error as any).message || 'Invalid credentials' });
  }
});

// Get user profile (for wallet status)
router.get('/profile', async (req: Request, res: Response) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid token' });

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      userId: user.id,
      email: user.email,
      username: user.user_metadata?.username,
      walletAddresses: profile.walletAddresses,
      profilePicture: profile.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;