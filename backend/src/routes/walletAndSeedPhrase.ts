import { Router, Request, Response } from 'express';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import HDKey from 'hdkey';
import { Keypair } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import prisma from '../utils/prisma';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_ANON_KEY missing in walletAndSeedPhrase.ts');
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}
const supabase = createClient(supabaseUrl, supabaseKey);

interface WalletCreationResponse {
  seedPhrase: string;
  addresses: {
    ethereum: string;
    bitcoin: string;
    solana: string;
  };
}

interface ErrorResponse {
  error: string;
}

// Middleware to verify JWT
const authenticateToken = async (req: Request, res: Response, next: Function) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: (error as any).message || 'Token verification failed' });
  }
};

// Wallet creation endpoint
router.post('/create', authenticateToken, async (req: Request, res: Response<WalletCreationResponse | ErrorResponse>) => {
  try {
    const userId = (req as any).user.id;

    // Check if profile exists, create if not
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({ data: { userId } });
    }

    // Check if wallet already exists
    if (profile.walletAddresses) {
      return res.status(400).json({ error: 'Wallet already created for this user' });
    }

    const mnemonicPhrase = bip39.generateMnemonic();
    const ethWallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
    const ethAddress = ethWallet.address;

    const btcSeed = bip39.mnemonicToSeedSync(mnemonicPhrase);
    const btcNode = HDKey.fromMasterSeed(btcSeed);
    const btcChild = btcNode.derive("m/84'/0'/0'/0/0");
    if (!btcChild.publicKey) throw new Error('Failed to derive Bitcoin address');
    const btcAddress = bitcoin.payments.p2wpkh({ pubkey: btcChild.publicKey, network: bitcoin.networks.bitcoin }).address!;

    const solSeed = bip39.mnemonicToSeedSync(mnemonicPhrase).slice(0, 32);
    const solKeyPair = Keypair.fromSeed(solSeed);
    const solAddress = solKeyPair.publicKey.toBase58();

    const addresses = { ethereum: ethAddress, bitcoin: btcAddress, solana: solAddress };

    await prisma.profile.update({
      where: { userId },
      data: { walletAddresses: addresses },
    });

    res.status(201).json({
      seedPhrase: mnemonicPhrase,
      addresses,
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to create wallet' });
  }
});

export default router;