"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bip39 = __importStar(require("bip39"));
const ethers_1 = require("ethers");
const cors_1 = __importDefault(require("cors"));
const bitcoin = __importStar(require("bitcoinjs-lib"));
const hdkey_1 = __importDefault(require("hdkey"));
const web3_js_1 = require("@solana/web3.js");
const app = (0, express_1.default)();
const PORT = 7777;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post('/api/wallet/create', (req, res) => {
    try {
        // Generate a 12-word seed phrase
        const mnemonicPhrase = bip39.generateMnemonic();
        // Derive Ethereum address
        const ethWallet = ethers_1.ethers.Wallet.fromPhrase(mnemonicPhrase);
        const ethAddress = ethWallet.address;
        // Derive Bitcoin address (P2WPKH, native SegWit)
        const btcSeed = bip39.mnemonicToSeedSync(mnemonicPhrase);
        const btcNode = hdkey_1.default.fromMasterSeed(btcSeed);
        const btcChild = btcNode.derive("m/84'/0'/0'/0/0");
        if (!btcChild.publicKey) {
            throw new Error('Failed to derive Bitcoin address');
        }
        const btcAddress = bitcoin.payments.p2wpkh({ pubkey: btcChild.publicKey, network: bitcoin.networks.bitcoin }).address;
        // Derive Solana address
        const solSeed = bip39.mnemonicToSeedSync(mnemonicPhrase).slice(0, 32);
        const solKeyPair = web3_js_1.Keypair.fromSeed(solSeed);
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
    }
    catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ error: 'Failed to create wallet' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
