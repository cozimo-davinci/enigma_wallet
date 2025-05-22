import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify Supabase JWT Token
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  req.user = data.user;
  next();
};

router
  .route('/profileDetails')
  .all(authMiddleware)
  .get(async (req: Request, res: Response) => {
    const user = req.user!;

    // Fetch or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      console.log(`No profile found for user ${user.id}, creating one`);
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          walletAddresses: {},
          profilePicture: null,
        },
      });
    }

    // Generate signed URL for profile picture if it exists
    let signedUrl: string | null = null;
    if (profile.profilePicture) {
      console.log(`Generating signed URL for ${profile.profilePicture}`);
      const { data: signedData, error: signedUrlError } = await supabase.storage
        .from('profile-pictures')
        .createSignedUrl(profile.profilePicture, 3600); // 1-hour expiration

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
        return res.status(500).json({ error: 'Failed to generate signed URL', details: signedUrlError.message });
      }

      signedUrl = signedData.signedUrl;
    }

    // Return combined user and profile data
    res.status(200).json({
      username: user.user_metadata?.username || 'N/A',
      email: user.email,
      profilePicture: signedUrl, // Return signed URL or null
    });
  })
  .post(upload.single('file'), async (req: Request, res: Response) => {
    const user = req.user!;
    const file = req.file;

    if (!file) {
      console.error('No file provided in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Uploading file:', {
      userId: user.id,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // Check file size (50 MB = 50 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size ${file.size} exceeds 50 MB limit`);
      return res.status(400).json({ error: 'File size exceeds 50 MB limit' });
    }

    // Upload file to Supabase Storage
    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `public/${user.id}.${extension}`;
    const { data, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image', details: uploadError.message });
    }

    console.log('File uploaded successfully:', data.path);

    // Update or create profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { profilePicture: data.path },
      create: {
        userId: user.id,
        walletAddresses: {},
        profilePicture: data.path,
      },
    });

    // Generate signed URL for the updated profile picture
    const { data: signedData, error: signedUrlError } = await supabase.storage
      .from('profile-pictures')
      .createSignedUrl(updatedProfile.profilePicture!, 3600);

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      return res.status(500).json({ error: 'Failed to generate signed URL', details: signedUrlError.message });
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profilePicture: signedData.signedUrl,
    });
  });

export default router;