"use client";

import { useState, useEffect, useCallback } from "react";
import { auron, submitPayment } from "@/lib/auron";
import { connectPhantom, sendUSDC, getPhantom, solscanUrl, AURON_TREASURY } from "@/lib/solana";
import type { Product } from "@/lib/products";

type Step = "idle" | "connecting" | "quoting" | "confirming" | "sending" | "settling" | "done" | "error";

export default function AuronCheckout({ product }: { product: Product }) {
  const [step, setStep]             = useState<Step>("idle");
  const [wallet, setWallet]         = useState<string | null>(null);
  const [usdcAmount, setUsdcAmt]    = useState<number | null>(null);
  const [auronRate, setAuronRate]   = useState<number | null>(null);
  const [txSig, setTxSig]           = useState<string | null>(null);
  const [paymentId, setPaymentId]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(60);
  const [hasPhantom, setHasPhantom] = useState<boolean | null>(null);

  useEffect(() => { setHasPhantom(!!getPhantom()); }, []);

  useEffect(() => {
    if (step !== "confirming") return;
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => c <= 1 ? (clearInterval(t), 0) : c - 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  const handlePay = useCallback(async () => {
    setError(null);
    try {
      setStep("connecting");
      const address = await connectPhantom();
      setWallet(address);
      setStep("quoting");
      const quote = await auron.getQuote(product.price);
      setUsdcAmt(quote.usdcAmount);
      setAuronRate(quote.auronRate);
      setStep("confirming");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }, [product.price]);

  const handleConfirm = useCallback(async () => {
    if (!wallet || !usdcAmount) return;
    setError(null);
    try {
      setStep("sending");
      const treasuryAddress = AURON_TREASURY.toString();
      if (treasuryAddress === "11111111111111111111111111111111")
        throw new Error("Treasury not configured — set NEXT_PUBLIC_AURON_TREASURY in .env.local");

      const signature = await sendUSDC(wallet, treasuryAddress, usdcAmount);
      setTxSig(signature);

      setStep("settling");
      const result = await submitPayment({
        paymentId:      crypto.randomUUID().replace(/-/g, ""),
        idempotencyKey: crypto.randomUUID().replace(/-/g, ""),
        merchantUpiId:  product.upiId,
        merchantName:   "BharatKit",
        inrAmount:      product.price,
        usdcAmount,
        txSignature:    signature,
        userId:         wallet,
        quoteFxRate:    auronRate ?? undefined,
      });
      setPaymentId(result.paymentId);
      setStep("done");
    } catch (err) {
      if (txSig) { setStep("done"); return; }
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  }, [wallet, usdcAmount, auronRate, product, txSig]);

  const reset = () => {
    setStep("idle"); setWallet(null); setUsdcAmt(null);
    setTxSig(null); setPaymentId(null); setError(null);
  };

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#aaa", letterSpacing: "0.1em" }}>
            Amount due
          </p>
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight" style={{ color: "#1a1a1a" }}>
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <button
            onClick={handlePay}
            className="w-full h-[52px] text-sm font-medium tracking-wide flex items-center justify-center gap-3 transition-all"
            style={{
              background: "#1a1a1a",
              color: "#fff",
              letterSpacing: "0.04em",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <PhantomLogo />
            Pay with Phantom
          </button>

          {hasPhantom === false && (
            <p className="text-center text-xs pt-0.5" style={{ color: "#bbb" }}>
              Requires{" "}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors"
                style={{ color: "#888" }}
              >
                Phantom wallet
              </a>
            </p>
          )}

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: "#e5e3de" }} />
            <span className="text-xs" style={{ color: "#ccc" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e5e3de" }} />
          </div>

          <button
            disabled
            className="w-full h-[52px] text-sm flex items-center justify-center gap-2.5 cursor-not-allowed"
            style={{
              border: "1px solid #e5e3de",
              color: "#ccc",
              background: "transparent",
              letterSpacing: "0.03em",
            }}
          >
            <span className="text-base">💳</span>
            Card / UPI
            <span
              className="ml-auto mr-0 text-[10px] uppercase tracking-widest px-2 py-0.5"
              style={{ background: "#f0ede8", color: "#bbb", letterSpacing: "0.08em" }}
            >
              Soon
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <LockIcon />
          <span className="text-xs" style={{ color: "#ccc" }}>Secured by Auron · Solana blockchain</span>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (["connecting", "quoting", "sending", "settling"].includes(step)) {
    const labels: Record<string, string> = {
      connecting: "Connecting wallet",
      quoting:    "Fetching live rate",
      sending:    "Waiting for approval",
      settling:   "Confirming payment",
    };
    const subs: Record<string, string> = {
      connecting: "Approve the connection in Phantom",
      quoting:    "Getting USDC / INR rate from CoinGecko",
      sending:    "Approve the USDC transfer in Phantom",
      settling:   "Recording on Solana and routing to UPI",
    };
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#aaa", letterSpacing: "0.1em" }}>
            Amount due
          </p>
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight" style={{ color: "#1a1a1a" }}>
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ border: "1px solid #e5e3de", background: "#faf9f7" }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
            style={{ borderColor: "#e0ddd8", borderTopColor: "#666" }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{labels[step]}</p>
            <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>{subs[step]}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (step === "confirming" && usdcAmount) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#aaa", letterSpacing: "0.1em" }}>
            You&apos;re paying
          </p>
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight" style={{ color: "#1a1a1a" }}>
            {usdcAmount.toFixed(4)}{" "}
            <span className="text-xl font-normal" style={{ color: "#aaa" }}>USDC</span>
          </p>
          <p className="text-sm mt-2" style={{ color: "#aaa" }}>
            ≈ ₹{product.price.toLocaleString("en-IN")} &nbsp;·&nbsp; 1 USDC = ₹{auronRate?.toFixed(2)}
          </p>
        </div>

        <div style={{ border: "1px solid #e5e3de" }}>
          {[
            { label: "Merchant receives", value: `₹${product.price.toLocaleString("en-IN")}`, valueStyle: { color: "#1a1a1a", fontWeight: 500 } },
            { label: "Settlement",        value: "Auron → UPI",                                valueStyle: { color: "#888" } },
            { label: "To",               value: product.upiId,                                 valueStyle: { color: "#888", fontFamily: "monospace", fontSize: "0.75rem" } },
            { label: "Wallet",           value: `${wallet?.slice(0,6)}…${wallet?.slice(-4)}`,  valueStyle: { color: "#888", fontFamily: "monospace", fontSize: "0.75rem" } },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex justify-between items-center px-5 py-3.5 text-sm"
              style={i < arr.length - 1 ? { borderBottom: "1px solid #e5e3de" } : {}}
            >
              <span style={{ color: "#aaa" }}>{row.label}</span>
              <span style={row.valueStyle}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full h-[52px] text-sm font-medium tracking-wide transition-all"
            style={{ background: "#1a1a1a", color: "#fff", letterSpacing: "0.04em" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
          >
            Confirm · {usdcAmount.toFixed(4)} USDC
          </button>
          <div className="flex items-center justify-between px-0.5">
            <button
              onClick={reset}
              className="text-xs transition-colors"
              style={{ color: "#bbb" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#666")}
              onMouseLeave={e => (e.currentTarget.style.color = "#bbb")}
            >
              Cancel
            </button>
            <span
              className="text-xs tabular-nums"
              style={{ color: countdown < 10 ? "#c0392b" : "#ccc" }}
            >
              Quote expires in {countdown}s
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "done" && txSig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ background: "#edf7f0", border: "1px solid #c5e8d0" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="#2d7a4f" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>Payment successful</p>
            <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>On-chain transfer confirmed</p>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e3de" }}>
          {[
            { label: "USDC sent",     value: `${usdcAmount?.toFixed(6)} USDC`, valueStyle: { color: "#555" } },
            { label: "INR delivered", value: `₹${product.price.toLocaleString("en-IN")}`, valueStyle: { color: "#2d7a4f", fontWeight: 500 } },
            { label: "To",            value: product.upiId,          valueStyle: { color: "#aaa", fontFamily: "monospace", fontSize: "0.72rem" } },
            { label: "Settlement",    value: "Processing → UPI",     valueStyle: { color: "#c4870a" } },
            ...(paymentId ? [{ label: "Payment ID", value: paymentId.slice(0,14) + "…", valueStyle: { color: "#ccc", fontFamily: "monospace", fontSize: "0.72rem" } }] : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex justify-between items-center px-5 py-3.5 text-sm"
              style={i < arr.length - 1 ? { borderBottom: "1px solid #e5e3de" } : {}}
            >
              <span style={{ color: "#aaa" }}>{row.label}</span>
              <span style={row.valueStyle}>{row.value}</span>
            </div>
          ))}
        </div>

        <a
          href={solscanUrl(txSig)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-[48px] text-sm flex items-center justify-center gap-2 transition-all"
          style={{ border: "1px solid #d8d5d0", color: "#888" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.color = "#1a1a1a"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#d8d5d0"; e.currentTarget.style.color = "#888"; }}
        >
          View on Solscan
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M8 2H4M8 2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </a>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#aaa", letterSpacing: "0.1em" }}>
            Amount due
          </p>
          <p className="text-[2.5rem] font-semibold leading-none tracking-tight" style={{ color: "#1a1a1a" }}>
            ₹{product.price.toLocaleString("en-IN")}
          </p>
        </div>

        <div
          className="px-5 py-4 flex items-start gap-3"
          style={{ border: "1px solid #f0c8c8", background: "#fdf5f5" }}
        >
          <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#c0392b" }}>✕</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "#c0392b" }}>Payment failed</p>
            {error && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#d97b7b" }}>{error}</p>
            )}
          </div>
        </div>

        <button
          onClick={reset}
          className="w-full h-[52px] text-sm font-medium tracking-wide transition-all"
          style={{ background: "#1a1a1a", color: "#fff", letterSpacing: "0.04em" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#333")}
          onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}

function PhantomLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.15"/>
      <path
        d="M32 20C32 26.6274 26.6274 32 20 32C13.3726 32 8 26.6274 8 20C8 13.3726 13.3726 8 20 8C26.6274 8 32 13.3726 32 20Z"
        fill="white"
        fillOpacity="0.25"
      />
      <path
        d="M26 16H14C13.4477 16 13 16.4477 13 17V23C13 23.5523 13.4477 24 14 24H26C26.5523 24 27 23.5523 27 23V17C27 16.4477 26.5523 16 26 16Z"
        fill="white"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
      <rect x="1.5" y="5" width="8" height="6.5" rx="1" stroke="#ccc" strokeWidth="1.1"/>
      <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}
