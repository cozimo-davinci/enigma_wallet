import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Optional, as it’s only set after middleware
    }
  }
}