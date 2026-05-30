"use client";

import { ConnectButton, useCurrentAccount, useConnectWallet, useWallets } from "@mysten/dapp-kit";
import TokenInfo from "../components/TokenInfo";
import Nav from "../components/Nav";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "";

const stats = [
  { label: "Total Supply", value: "1,000,000,000,000" },
  { label: "Ticker", value: "MEME" },
  { label: "Decimals", value: "6" },
  { label: "Network", value: "SUI Testnet" },
  { label: "Tax", value: "0%" },
  { label: "Mint Authority", value: "Renounced*" },
];

const faqItems = [
  {
    q: "What is MEMECOIN?",
    a: "MEMECOIN (MEME) is a community meme coin on the SUI network with a fixed supply of 1 trillion tokens and zero transaction tax.",
  },
  {
    q: "How do I buy MEME?",
    a: "Connect your SUI wallet (Phantom, Sui Wallet, or Suiet), then swap on Cetus or Turbos Finance using SUI.",
  },
  {
    q: "Is the contract safe?",
    a: "The Move contract is minimal — create currency, mint, burn. No admin functions, no upgrades, no fees. Treasury cap is renounced after the initial mint.",
  },
  {
    q: "What chain is this on?",
    a: "SUI — a high-speed Layer 1 blockchain with sub-second finality and near-zero gas fees.",
  },
];

export default function Home() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const phantom = wallets.find((w) => w.name === "Phantom");

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.glow} />
        <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 16 }}>🐸</div>
        <h1 style={styles.heroTitle}>MEMECOIN</h1>
        <p style={styles.heroSub}>The dankest coin on SUI. 1 trillion supply. Zero tax. Pure vibes.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {phantom && !account ? (
            <button
              onClick={() => connectWallet({ wallet: phantom })}
              style={styles.phantomBtn}
            >
              <img src="https://phantom.app/favicon.ico" width={18} height={18} style={{ borderRadius: 4 }} />
              Connect Phantom
            </button>
          ) : null}
          <ConnectButton />
          <a href="#buy" style={styles.buyBtn}>How to Buy</a>
        </div>
        {account && PACKAGE_ID && (
          <div style={{ marginTop: 32 }}>
            <TokenInfo address={account.address} packageId={PACKAGE_ID} />
          </div>
        )}
        {!PACKAGE_ID && (
          <p style={styles.devNote}>⚠️ Contract not yet deployed — set NEXT_PUBLIC_PACKAGE_ID in .env.local</p>
        )}
      </section>

      {/* Stats */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Tokenomics</h2>
        <div style={styles.grid}>
          {stats.map(({ label, value }) => (
            <div key={label} style={styles.card}>
              <div style={styles.cardLabel}>{label}</div>
              <div style={styles.cardValue}>{value}</div>
            </div>
          ))}
        </div>
        <p style={styles.footnote}>* Treasury cap will be renounced (transferred to 0x0) after the initial mint is complete.</p>
      </section>

      {/* How to buy */}
      <section id="buy" style={styles.section}>
        <h2 style={styles.sectionTitle}>How to Buy</h2>
        <div style={styles.steps}>
          {[
            { n: "1", title: "Get a SUI Wallet", body: "Download Phantom (phantom.app) or Sui Wallet (suiwallet.com) as a Chrome extension. Create a new wallet and back up your seed phrase." },
            { n: "2", title: "Get SUI", body: "Buy SUI on Binance, Coinbase, or KuCoin and withdraw to your wallet address." },
            { n: "3", title: "Swap for MEME", body: "Go to Cetus Finance or Turbos Finance. Connect your wallet, paste the MEME contract address, and swap." },
            { n: "4", title: "Hold & Vibe", body: "You now hold MEME. Add it to your wallet's token list using the contract address below." },
          ].map(({ n, title, body }) => (
            <div key={n} style={styles.step}>
              <div style={styles.stepNum}>{n}</div>
              <div>
                <div style={styles.stepTitle}>{title}</div>
                <div style={styles.stepBody}>{body}</div>
              </div>
            </div>
          ))}
        </div>
        {PACKAGE_ID && (
          <div style={styles.contractBox}>
            <span style={{ color: "#888", fontSize: 12 }}>Contract Address</span>
            <code style={styles.contractAddr}>{PACKAGE_ID}</code>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>FAQ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqItems.map(({ q, a }) => (
            <div key={q} style={styles.faqItem}>
              <div style={styles.faqQ}>{q}</div>
              <div style={styles.faqA}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ fontSize: 32 }}>🐸</div>
        <p style={{ color: "#444", fontSize: 13, margin: "8px 0 0" }}>
          MEMECOIN is a meme coin with no intrinsic value or expectation of financial return.
          For entertainment purposes only. Not financial advice.
        </p>
      </footer>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: "relative",
    textAlign: "center",
    padding: "100px 20px 80px",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 600,
    height: 600,
    background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroTitle: {
    fontSize: "clamp(48px, 10vw, 96px)",
    fontWeight: 900,
    letterSpacing: "-3px",
    margin: "0 0 12px",
    background: "linear-gradient(135deg, #4ade80, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    color: "#888",
    fontSize: "clamp(16px, 2.5vw, 20px)",
    maxWidth: 480,
    margin: "0 auto 36px",
    lineHeight: 1.5,
  },
  phantomBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#ab9ff2",
    border: "none",
    color: "#000",
    padding: "12px 24px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  buyBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "transparent",
    border: "1px solid #333",
    color: "#fff",
    padding: "11px 24px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  devNote: {
    color: "#f59e0b",
    fontSize: 13,
    marginTop: 24,
  },
  section: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "60px 20px",
    borderTop: "1px solid #111",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 32,
    letterSpacing: "-0.5px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 16,
    padding: "24px 20px",
  },
  cardLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#4ade80",
  },
  footnote: {
    color: "#444",
    fontSize: 12,
    marginTop: 16,
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  step: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4ade80, #22d3ee)",
    color: "#000",
    fontWeight: 900,
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepTitle: {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 4,
  },
  stepBody: {
    color: "#888",
    fontSize: 14,
    lineHeight: 1.6,
  },
  contractBox: {
    marginTop: 32,
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  contractAddr: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#4ade80",
    wordBreak: "break-all",
  },
  faqItem: {
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: "20px 24px",
  },
  faqQ: {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 8,
  },
  faqA: {
    color: "#888",
    fontSize: 14,
    lineHeight: 1.6,
  },
  footer: {
    textAlign: "center",
    padding: "40px 20px",
    borderTop: "1px solid #111",
  },
};
