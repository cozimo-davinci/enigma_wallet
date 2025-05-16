import express, { Request, Response } from 'express';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import cors from 'cors';
import * as bitcoin from 'bitcoinjs-lib';
import HDKey from 'hdkey';
import { Keypair } from '@solana/web3.js';

const app = express();
const PORT = 7777;

app.use(express.json());
app.use(cors());

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

app.post('/api/wallet/create', (req: Request, res: Response<WalletCreationResponse | ErrorResponse>) => {
  try {
    // Generate a 12-word seed phrase
    const mnemonicPhrase = bip39.generateMnemonic();

    // Derive Ethereum address
    const ethWallet = ethers.Wallet.fromPhrase(mnemonicPhrase);
    const ethAddress = ethWallet.address;

    // Derive Bitcoin address (P2WPKH, native SegWit)
    const btcSeed = bip39.mnemonicToSeedSync(mnemonicPhrase);
    const btcNode = HDKey.fromMasterSeed(btcSeed);
    const btcChild = btcNode.derive("m/84'/0'/0'/0/0");
    
    if(!btcChild.publicKey) {
        throw new Error('Failed to derive Bitcoin address');
    }
    const btcAddress = bitcoin.payments.p2wpkh({ pubkey: btcChild.publicKey, network: bitcoin.networks.bitcoin }).address!;

    // Derive Solana address
    const solSeed = bip39.mnemonicToSeedSync(mnemonicPhrase).slice(0, 32);
    const solKeyPair = Keypair.fromSeed(solSeed);
    const solAddress = solKeyPair.publicKey.toBase58();

    res.status(201).json({
      seedPhrase: mnemonicPhrase,
      addresses: {
        ethereum: ethAddress,
        bitcoin: btcAddress,
        solana: solAddress,
      },
    });
    console.log('Wallet created successfully');
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});