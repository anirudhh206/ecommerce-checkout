"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getProduct } from "@/lib/products";
import AuronCheckout from "@/components/AuronCheckout";

function CheckoutContent() {
  const params    = useSearchParams();
  const productId = params.get("product") ?? "";
  const product   = getProduct(productId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f6f3" }}>
        <div className="text-center space-y-3">
          <p style={{ color: "#999" }} className="text-sm">Product not found.</p>
          <Link href="/" className="text-sm underline underline-offset-4" style={{ color: "#1a1a1a" }}>
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#f7f6f3" }}>

      {/* ── Left: Order summary ───────────────────────────────────────────── */}
      <div
        className="md:w-[440px] md:min-h-screen flex flex-col px-10 py-12 md:border-r"
        style={{ background: "#f2f1ee", borderColor: "#e5e3de" }}
      >
        {/* Store */}
        <Link href="/" className="flex items-center justify-between mb-14 group">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🇮🇳</span>
            <span className="font-semibold tracking-wide text-sm" style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}>
              BHARATKIT
            </span>
          </div>
          <span
            className="text-xs transition-colors"
            style={{ color: "#aaa" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#666")}
            onMouseLeave={e => (e.currentTarget.style.color = "#aaa")}
          >
            ← Store
          </span>
        </Link>

        {/* Product */}
        <div className="flex items-start gap-5 mb-10">
          <div
            className="relative w-[72px] h-[72px] rounded-lg flex-shrink-0 overflow-hidden"
            style={{ background: product.color, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="72px"
            />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#aaa", letterSpacing: "0.1em" }}>
              {product.category}
            </p>
            <p className="font-medium text-sm leading-snug" style={{ color: "#1a1a1a" }}>
              {product.name}
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#999" }}>
              {product.description}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-3.5 text-sm border-t pt-7" style={{ borderColor: "#e5e3de" }}>
          <div className="flex justify-between">
            <span style={{ color: "#999" }}>Subtotal</span>
            <span style={{ color: "#555" }}>₹{product.price.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#999" }}>Shipping</span>
            <span style={{ color: "#999" }}>Free</span>
          </div>
          <div className="flex justify-between pt-4 border-t" style={{ borderColor: "#e5e3de" }}>
            <span className="font-medium text-sm" style={{ color: "#1a1a1a" }}>Total</span>
            <span className="font-semibold text-base" style={{ color: "#1a1a1a" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Merchant */}
        <div className="mt-7 pt-7 border-t" style={{ borderColor: "#e5e3de" }}>
          <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "#bbb", letterSpacing: "0.08em" }}>
            Merchant
          </p>
          <p className="text-sm font-mono" style={{ color: "#888" }}>{product.upiId}</p>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-10">
          <p className="text-xs" style={{ color: "#c0bebb" }}>
            Payments by{" "}
            <a
              href="https://www.npmjs.com/package/@auron-solana/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#aaa" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#555")}
              onMouseLeave={e => (e.currentTarget.style.color = "#aaa")}
            >
              @auron-solana/sdk
            </a>
          </p>
        </div>
      </div>

      {/* ── Right: Payment ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-10 py-12">
        <div className="w-full max-w-[380px]">
          <AuronCheckout product={product} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f6f3" }}>
        <div
          className="w-4 h-4 rounded-full border animate-spin"
          style={{ borderColor: "#ddd", borderTopColor: "#888" }}
        />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
