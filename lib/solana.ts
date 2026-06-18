"use client";

import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

// Devnet USDC mint (matches Auron's devnet config)
export const USDC_MINT_DEVNET = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
export const USDC_DECIMALS    = 6;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? "https://api.devnet.solana.com";

export const AURON_TREASURY = new PublicKey(
  process.env.NEXT_PUBLIC_AURON_TREASURY ?? "11111111111111111111111111111111"
);

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function solscanUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}?cluster=devnet`;
}

// ── Phantom provider ──────────────────────────────────────────────────────────

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signAndSendTransaction(tx: Transaction): Promise<{ signature: string }>;
}

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const phantom = (window as unknown as { solana?: PhantomProvider }).solana;
  return phantom?.isPhantom ? phantom : null;
}

export async function connectPhantom(): Promise<string> {
  const phantom = getPhantom();
  if (!phantom) {
    window.open("https://phantom.app", "_blank");
    throw new Error("Phantom wallet not found. Please install it first.");
  }
  const res = await phantom.connect();
  return res.publicKey.toString();
}

// ── USDC transfer ─────────────────────────────────────────────────────────────

export async function sendUSDC(
  fromAddress: string,
  toAddress: string,
  usdcAmount: number,
): Promise<string> {
  const phantom = getPhantom();
  if (!phantom) throw new Error("Phantom not connected");

  const connection  = getConnection();
  const from        = new PublicKey(fromAddress);
  const to          = new PublicKey(toAddress);
  const rawAmount   = BigInt(Math.round(usdcAmount * 10 ** USDC_DECIMALS));

  // Get sender ATA
  const fromAta = await getAssociatedTokenAddress(USDC_MINT_DEVNET, from);

  // Get or derive recipient ATA (read-only — treasury ATA must already exist)
  const toAta = await getAssociatedTokenAddress(USDC_MINT_DEVNET, to);

  const ix = createTransferCheckedInstruction(
    fromAta,
    USDC_MINT_DEVNET,
    toAta,
    from,
    rawAmount,
    USDC_DECIMALS,
  );

  const tx = new Transaction().add(ix);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash    = blockhash;
  tx.feePayer           = from;

  const { signature } = await phantom.signAndSendTransaction(tx);

  // Wait for confirmation
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  return signature;
}
