"use client";

import Nav from "../../components/Nav";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "<your-package-id>";
const COIN_TYPE = `${PACKAGE_ID}::meme::MEME`;

const dexes = [
  {
    name: "Cetus Finance",
    url: "https://app.cetus.zone/liquidity/create",
    description: "Largest DEX on SUI. Concentrated liquidity pools.",
    logo: "🌊",
  },
  {
    name: "Turbos Finance",
    url: "https://app.turbos.finance/#/pools/create",
    description: "Fast, low-fee AMM on SUI. Easy pool creation.",
    logo: "⚡",
  },
  {
    name: "Aftermath Finance",
    url: "https://aftermath.finance/pools",
    description: "Multi-asset pools and deep liquidity.",
    logo: "🌪",
  },
];

const steps = [
  {
    title: "Mint your initial MEME supply",
    body: `First run the mint script so your wallet holds MEME tokens. You'll need both MEME and SUI to create the pool — SUI is the other half of the trading pair.`,
  },
  {
    title: "Choose a DEX and connect wallet",
    body: "Go to one of the DEXes below. Connect your SUI wallet (Sui Wallet extension). Make sure you're on mainnet if launching for real, or testnet while testing.",
  },
  {
    title: "Create a new pool",
    body: `Click "Create Pool" or "New Position". Select MEME as Token A and SUI (or USDC) as Token B. Paste your coin type address when prompted.`,
  },
  {
    title: "Set the initial price",
    body: "The first liquidity provider sets the price. For example: 1 SUI = 10,000,000 MEME. This determines the starting market cap.",
  },
  {
    title: "Set your price range",
    body: "For meme coins, a full-range position (min → max) is simplest. This means you earn fees at any price. Narrower ranges earn more fees but require active management.",
  },
  {
    title: "Deposit and confirm",
    body: "Enter the amounts of MEME and SUI to deposit. Approve the transaction in your wallet. Gas on SUI is usually under $0.01.",
  },
];

export default function LiquidityPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "60px 20px" }}>
        <h1 style={styles.pageTitle}>Add Liquidity</h1>
        <p style={styles.pageDesc}>
          Creating a liquidity pool makes MEME tradeable on DEXes. Anyone can then swap SUI for MEME.
        </p>

        {/* Coin type box */}
        <div style={styles.infoBox}>
          <div style={styles.infoLabel}>MEME Coin Type (paste this into DEXes)</div>
          <code style={styles.codeBlock}>{COIN_TYPE}</code>
        </div>

        {/* Steps */}
        <h2 style={styles.sectionTitle}>Step-by-step</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
          {steps.map(({ title, body }, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNum}>{i + 1}</div>
              <div>
                <div style={styles.stepTitle}>{title}</div>
                <div style={styles.stepBody}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DEXes */}
        <h2 style={styles.sectionTitle}>DEX Options</h2>
        <div style={styles.dexGrid}>
          {dexes.map(({ name, url, description, logo }) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={styles.dexCard}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{logo}</div>
              <div style={styles.dexName}>{name}</div>
              <div style={styles.dexDesc}>{description}</div>
              <div style={styles.dexLink}>Open DEX →</div>
            </a>
          ))}
        </div>

        {/* Tips */}
        <div style={styles.tipsBox}>
          <div style={styles.tipsTitle}>💡 Tips for meme coin launches</div>
          <ul style={styles.tipsList}>
            <li>Start with a small liquidity amount to test, then add more once confirmed working.</li>
            <li>Lock liquidity (via Cetus lock feature) to build trust — it proves you can't rug the pool.</li>
            <li>Keep some MEME and SUI in reserve so you can add more liquidity if the price moves a lot.</li>
            <li>Share the DEX pool link (not just the contract) so people can trade easily.</li>
          </ul>
        </div>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageTitle: { fontSize: 36, fontWeight: 900, letterSpacing: "-1px", marginBottom: 12 },
  pageDesc: { color: "#888", fontSize: 16, lineHeight: 1.6, marginBottom: 32 },
  infoBox: {
    background: "#111",
    border: "1px solid #1a1a1a",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 48,
  },
  infoLabel: { color: "#555", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 },
  codeBlock: { fontFamily: "monospace", fontSize: 13, color: "#4ade80", wordBreak: "break-all" },
  sectionTitle: { fontSize: 22, fontWeight: 800, marginBottom: 24 },
  stepCard: { display: "flex", gap: 20, alignItems: "flex-start", background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px 24px" },
  stepNum: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg, #4ade80, #22d3ee)",
    color: "#000", fontWeight: 900, fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stepTitle: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  stepBody: { color: "#888", fontSize: 14, lineHeight: 1.6 },
  dexGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 48 },
  dexCard: {
    background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "24px 20px",
    textDecoration: "none", color: "#fff", display: "block", transition: "border-color 0.2s",
  },
  dexName: { fontWeight: 800, fontSize: 17, marginBottom: 8 },
  dexDesc: { color: "#888", fontSize: 13, lineHeight: 1.5, marginBottom: 16 },
  dexLink: { color: "#4ade80", fontSize: 13, fontWeight: 600 },
  tipsBox: { background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 16, padding: "24px 28px" },
  tipsTitle: { fontWeight: 700, fontSize: 16, marginBottom: 16 },
  tipsList: { color: "#888", fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 },
};
