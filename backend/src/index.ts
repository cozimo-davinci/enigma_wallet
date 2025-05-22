import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userAuthRouter from './routes/userAuth';
import walletAndSeedPhraseRouter from './routes/walletAndSeedPhrase';
import blockchainBalanceRouter from './routes/blockchainBalance';
import profileRouter from './routes/profile';

// Resolve .env path
const envPath = path.resolve(__dirname, '../.env');
console.log('Attempting to load .env from:', envPath);

// Load .env file
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env:', result.error);
  process.exit(1);
} else {
  console.log('.env loaded successfully');
}

// Debug environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'undefined');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '[REDACTED]' : 'undefined');
console.log('ALCHEMY_API_KEY:', process.env.ALCHEMY_API_KEY ? '[REDACTED]' : 'undefined');
console.log('ALCHEMY_SOLANA_RPC:', process.env.ALCHEMY_SOLANA_RPC ? '[REDACTED]' : 'undefined');
console.log('BLOCKCYPHER_API_TOKEN:', process.env.BLOCKCYPHER_API_TOKEN ? '[REDACTED]' : 'undefined');

const app = express();
const PORT = 7777;

app.use(express.json());
app.use(cors());

// Mount routes
app.use('/api', userAuthRouter);
app.use('/api/wallet', walletAndSeedPhraseRouter);
app.use('/api/blockchain', blockchainBalanceRouter);
app.use('/api/profile', profileRouter)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});