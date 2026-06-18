import Link from "next/link";
import Image from "next/image";
import { PRODUCTS } from "@/lib/products";

export default function StorePage() {
  return (
    <div className="min-h-screen" style={{ background: "#f7f6f3" }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        className="px-8 py-5 flex items-center justify-between border-b"
        style={{ borderColor: "#e5e3de", background: "#f2f1ee" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-base">🇮🇳</span>
          <span
            className="font-semibold text-sm"
            style={{ color: "#1a1a1a", letterSpacing: "0.1em" }}
          >
            BHARATKIT
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs hidden sm:block" style={{ color: "#bbb" }}>
            Merch for Indian Web3 builders
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs" style={{ color: "#aaa" }}>Auron payments live</span>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-16 pb-12 max-w-4xl">
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: "#aaa", letterSpacing: "0.12em" }}
        >
          New collection — SS 2026
        </p>
        <h1
          className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight mb-4"
          style={{ color: "#1a1a1a" }}
        >
          Build on Bharat.<br />
          <span style={{ color: "#aaa", fontWeight: 400 }}>Pay in USDC.</span>
        </h1>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#999" }}>
          Real merchandise. Pay with Phantom — merchant receives INR via UPI. No crypto setup required.
        </p>
      </div>

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <div className="px-8 pb-20 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "#e5e3de" }}>
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="flex flex-col group"
              style={{ background: "#f7f6f3" }}
            >
              {/* Product image */}
              <div
                className="relative h-72 overflow-hidden"
                style={{ background: product.color }}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col flex-1 border-t" style={{ borderColor: "#e5e3de" }}>
                <p
                  className="text-[10px] uppercase tracking-widest mb-1.5"
                  style={{ color: "#bbb", letterSpacing: "0.1em" }}
                >
                  {product.category}
                </p>
                <h2 className="text-sm font-medium leading-snug mb-2" style={{ color: "#1a1a1a" }}>
                  {product.name}
                </h2>
                <p className="text-xs leading-relaxed flex-1" style={{ color: "#aaa" }}>
                  {product.description}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  <Link
                    href={`/checkout?product=${product.id}`}
                    className="text-xs font-medium px-4 py-2 transition-colors"
                    style={{
                      background: "#1a1a1a",
                      color: "#fff",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Buy
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SDK strip ─────────────────────────────────────────────────────── */}
        <div
          className="mt-px flex flex-col sm:flex-row items-start sm:items-center gap-6 px-6 py-5 border-b border-l border-r"
          style={{ borderColor: "#e5e3de", background: "#f2f1ee" }}
        >
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "#aaa", letterSpacing: "0.08em" }}>
              Developer
            </p>
            <p className="text-sm" style={{ color: "#555" }}>
              This store runs on{" "}
              <code
                className="text-xs px-1.5 py-0.5"
                style={{ background: "#eae8e4", color: "#555", fontFamily: "monospace" }}
              >
                @auron-solana/sdk
              </code>
              {" "}— accept USDC on Solana, settle INR to any UPI ID.
            </p>
          </div>
          <a
            href="https://www.npmjs.com/package/@auron-solana/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-colors whitespace-nowrap"
            style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            npm install →
          </a>
        </div>
      </div>
    </div>
  );
}
