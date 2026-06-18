import { AuronClient } from "@auron-solana/sdk";

const BASE_URL = (process.env.NEXT_PUBLIC_AURON_URL ?? "https://auron-mocha.vercel.app").replace(/\/$/, "");

// SDK client — used for getQuote() (no auth needed)
export const auron = new AuronClient({
  apiKey:  process.env.NEXT_PUBLIC_AURON_API_KEY ?? "demo",
  baseUrl: BASE_URL,
});

// Human-wallet pay — no x-api-key header (Auron's human wallet flow passes through)
export async function submitPayment(body: {
  paymentId:     string;
  idempotencyKey: string;
  merchantUpiId: string;
  merchantName:  string;
  inrAmount:     number;
  usdcAmount:    number;
  txSignature:   string;
  userId:        string;
  quoteFxRate?:  number;
}): Promise<{ paymentId: string; status: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/pay`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },  // no x-api-key → human wallet flow
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((data.error as string) ?? `Payment failed (${res.status})`);
  }

  return res.json() as Promise<{ paymentId: string; status: string }>;
}
