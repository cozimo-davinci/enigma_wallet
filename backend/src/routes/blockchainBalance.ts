import express, { Request, Response } from 'express';
import { ethers, AlchemyProvider, Contract, isAddress, formatEther, formatUnits } from 'ethers';
import axios, { AxiosError } from 'axios';
import * as solanaWeb3 from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import NodeCache from 'node-cache';

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

// Initialize cache (TTL: 2 minutes for balances, 1 hour for token metadata)
const cache = new NodeCache({ stdTTL: 120, checkperiod: 30 });
const TOKEN_LIST_CACHE_KEY = 'solana_token_list';
const TOKEN_LIST_TTL = 3600; // 1 hour

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

// Interface for Solana token list
interface SolanaTokenList {
  tokens: Token[];
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
];

// Token Program IDs
const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

// Retry logic for 429 errors
async function retryRequest<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        if (attempt === maxRetries) throw error;
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Rate limit hit, retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Retry logic failed');
}

// Fetch token metadata from Solana token list (cached)
async function getTokenMetadata(mintAddress: string): Promise<{ symbol: string; name: string; decimals: number }> {
  try {
    let tokenList = cache.get<SolanaTokenList>(TOKEN_LIST_CACHE_KEY);
    if (!tokenList) {
      console.debug('Fetching Solana token list from GitHub');
      const response = await retryRequest(() =>
        axios.get<SolanaTokenList>('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
      );
      tokenList = response.data;
      cache.set<SolanaTokenList>(TOKEN_LIST_CACHE_KEY, tokenList, TOKEN_LIST_TTL);
      console.debug(`Cached Solana token list (TTL: ${TOKEN_LIST_TTL}s)`);
    }
    const token = tokenList.tokens.find((t: Token) => t.address === mintAddress);
    return token
      ? { symbol: token.symbol, name: token.name, decimals: token.decimals }
      : { symbol: 'Unknown', name: 'Unknown Token', decimals: 9 };
  } catch (error) {
    console.warn(`Failed to fetch token metadata for mint ${mintAddress}:`, error);
    return { symbol: 'Unknown', name: 'Unknown Token', decimals: 9 };
  }
}

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

  // Check cache
  const cacheKey = `${blockchain}:${address}`;
  const cachedResponse = cache.get<BalanceResponse>(cacheKey);
  if (cachedResponse) {
    console.debug(`Returning cached balance for ${cacheKey} (expires in ${cache.getTtl(cacheKey) ? Math.floor((cache.getTtl(cacheKey)! - Date.now()) / 1000) : 'unknown'}s)`);
    return res.json(cachedResponse);
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

    // Cache the response
    cache.set<BalanceResponse>(cacheKey, response);
    console.debug(`Cached balance for ${cacheKey} (TTL: 120s)`);
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

  const balance = await retryRequest(() => ethProvider.getBalance(address));
  const ethBalance = formatEther(balance);

  // Fetch all ERC-20 token balances
  const tokenBalances = await retryRequest(() => ethProvider.send('alchemy_getTokenBalances', [address, 'erc20']));
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
  const response = await retryRequest(() => axios.get(url));

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

// Fetch Solana balance and SPL/Token-2022 tokens
async function getSolanaBalance(address: string): Promise<BalanceResponse> {
  let publicKey: solanaWeb3.PublicKey;
  try {
    publicKey = new solanaWeb3.PublicKey(address);
  } catch {
    throw new Error('Invalid Solana address');
  }

  // Get native SOL balance
  const balance = await retryRequest(() => solanaConnection.getBalance(publicKey));
  const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

  // Define token programs
  const tokenPrograms = [
    { id: SPL_TOKEN_PROGRAM_ID, name: 'SPL Token' },
    { id: TOKEN_2022_PROGRAM_ID, name: 'Token-2022' },
  ];

  let allTokens: any[] = [];

  // Fetch token accounts for each program
  for (const program of tokenPrograms) {
    let programId: solanaWeb3.PublicKey;
    try {
      programId = new solanaWeb3.PublicKey(program.id);
      console.debug(`Fetching token accounts for ${program.name} program ID: ${programId.toString()}`);
    } catch (error) {
      console.error(`Invalid ${program.name} program ID: ${program.id}`, error);
      continue;
    }

    try {
      const tokenAccounts = await retryRequest(() =>
        solanaConnection.getTokenAccountsByOwner(publicKey, { programId })
      );
      console.debug(`Found ${tokenAccounts.value.length} ${program.name} accounts for address ${address}`);

      const tokens = await Promise.all(
        tokenAccounts.value.map(async (account) => {
          try {
            const accountInfo = await retryRequest(() => getAccount(solanaConnection, account.pubkey));
            const mintAddress = accountInfo.mint.toString();
            const metadata = await getTokenMetadata(mintAddress);
            const balance = (Number(accountInfo.amount) / Math.pow(10, metadata.decimals)).toString();
            return {
              tokenAddress: mintAddress,
              name: metadata.name,
              symbol: metadata.symbol,
              balance,
            };
          } catch (error) {
            console.warn(`Failed to fetch account info for ${account.pubkey.toString()} (${program.name}):`, error);
            return null;
          }
        })
      );

      allTokens.push(...tokens.filter((token): token is NonNullable<typeof token> => token !== null));
    } catch (error) {
      console.warn(`Failed to fetch ${program.name} token accounts for ${address}:`, error);
    }
  }

  return {
    nativeBalance: `${solBalance} SOL`,
    tokens: allTokens,
  };
}

export default router;