import express, { Request, Response } from 'express';
import { ethers, AlchemyProvider, Contract, isAddress, formatEther, formatUnits } from 'ethers';
import axios from 'axios';
import * as solanaWeb3 from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Initialize router
const router = express.Router();

// Environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_SOLANA_RPC = process.env.ALCHEMY_SOLANA_RPC;
const BLOCKCYPHER_API_TOKEN = process.env.BLOCKCYPHER_API_TOKEN;

// Validate environment variables
if (!ALCHEMY_API_KEY || !ALCHEMY_SOLANA_RPC || !BLOCKCYPHER_API_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Ethereum provider
const ethProvider = new AlchemyProvider('mainnet', ALCHEMY_API_KEY);

// Initialize Solana connection
const solanaConnection = new solanaWeb3.Connection(ALCHEMY_SOLANA_RPC, 'confirmed');

// Interface for request body
interface BalanceRequest {
  blockchain: 'ethereum' | 'bitcoin' | 'solana';
  address: string;
}

// Interface for response
interface BalanceResponse {
  nativeBalance: string; // Native currency balance (ETH, BTC, SOL)
  tokens: Array<{
    tokenAddress: string;
    name?: string;
    symbol?: string;
    balance: string;
  }>;
}

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Endpoint to fetch balance and tokens
router.post('/balance', async (req: Request, res: Response) => {
  const { blockchain, address }: BalanceRequest = req.body;

  // Validate request
  if (!blockchain || !address) {
    return res.status(400).json({ error: 'Blockchain and address are required' });
  }

  if (!['ethereum', 'bitcoin', 'solana'].includes(blockchain)) {
    return res.status(400).json({ error: 'Unsupported blockchain' });
  }

  try {
    let response: BalanceResponse;

    switch (blockchain) {
      case 'ethereum':
        response = await getEthereumBalance(address);
        break;
      case 'bitcoin':
        response = await getBitcoinBalance(address);
        break;
      case 'solana':
        response = await getSolanaBalance(address);
        break;
      default:
        throw new Error('Invalid blockchain');
    }

    res.json(response);
  } catch (error: any) {
    console.error(`Error fetching balance for ${blockchain} address ${address}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
  }
});

// Fetch Ethereum balance and ERC-20 tokens
async function getEthereumBalance(address: string): Promise<BalanceResponse> {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  const balance = await ethProvider.getBalance(address);
  const ethBalance = formatEther(balance);

  // Fetch all ERC-20 token balances
  const tokenBalances = await ethProvider.send('alchemy_getTokenBalances', [address, 'erc20']);
  const tokens = await Promise.all(
    tokenBalances.tokenBalances
      .filter((token: any) => token.tokenBalance !== '0')
      .map(async (token: any) => {
        const contract = new Contract(token.contractAddress, ERC20_ABI, ethProvider);
        const balance = token.tokenBalance;
        const decimals = await contract.decimals();
        const symbol = await contract.symbol();
        const name = await contract.name();
        const formattedBalance = formatUnits(balance, decimals);
        return {
          tokenAddress: token.contractAddress,
          name,
          symbol,
          balance: formattedBalance,
        };
      })
  );

  return {
    nativeBalance: `${ethBalance} ETH`,
    tokens,
  };
}
// Fetch Bitcoin balance
async function getBitcoinBalance(address: string): Promise<BalanceResponse> {
  // Use Blockcypher API to fetch balance
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?token=${BLOCKCYPHER_API_TOKEN}`;
  const response = await axios.get(url);

  if (response.status !== 200) {
    throw new Error('Failed to fetch Bitcoin balance');
  }

  const data = response.data;
  const balance = data.balance / 1e8; // Convert satoshis to BTC

  return {
    nativeBalance: `${balance} BTC`,
    tokens: [], // Bitcoin does not have tokens like ERC-20
  };
}

// Fetch Solana balance and SPL tokens
async function getSolanaBalance(address: string): Promise<BalanceResponse> {
  let publicKey: solanaWeb3.PublicKey;
  try {
    publicKey = new solanaWeb3.PublicKey(address);
  } catch {
    throw new Error('Invalid Solana address');
  }

  const balance = await solanaConnection.getBalance(publicKey);
  const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

  // Fetch all SPL token accounts
  const tokenAccounts = await solanaConnection.getTokenAccountsByOwner(publicKey, {
    programId: new solanaWeb3.PublicKey(solanaWeb3.VOTE_PROGRAM_ID),
  });

  const tokens = await Promise.all(
    tokenAccounts.value.map(async (account) => {
      const accountInfo = await getAccount(solanaConnection, account.pubkey);
      const mintAddress = accountInfo.mint.toString();
      // Fetch token metadata (simplified; use Metaplex or another API for full metadata)
      const symbol = mintAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'Unknown';
      const name = mintAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USD Coin' : 'Unknown Token';
      const decimals = mintAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 6 : 9; // Adjust based on token
      const balance = (Number(accountInfo.amount) / Math.pow(10, decimals)).toString();
      return {
        tokenAddress: mintAddress,
        name,
        symbol,
        balance,
      };
    })
  );

  return {
    nativeBalance: `${solBalance} SOL`,
    tokens,
  };
}

export default router;