"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function Nav() {
  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <a href="/" style={logoStyle}>🐸 MEME</a>
        <div style={linksStyle}>
          <a href="#buy" style={linkStyle}>How to Buy</a>
          <a href="/liquidity" style={linkStyle}>Liquidity</a>
          <a
            href="https://suiscan.xyz"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Explorer
          </a>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "rgba(10,10,10,0.85)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid #111",
};

const innerStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: "0 auto",
  padding: "0 20px",
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const logoStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 20,
  color: "#fff",
  textDecoration: "none",
  letterSpacing: "-0.5px",
};

const linksStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
};

const linkStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
};
