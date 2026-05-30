"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";

interface Props {
  address: string;
  packageId: string;
}

export default function TokenInfo({ address, packageId }: Props) {
  const coinType = `${packageId}::meme::MEME`;

  const { data, isLoading, isError } = useSuiClientQuery("getCoins", {
    owner: address,
    coinType,
  });

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Your MEME Balance</div>
        <div style={{ color: "#555", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (isError || !data?.data.length) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>Your MEME Balance</div>
        <div style={valueStyle}>0</div>
        <div style={subStyle}>No MEME tokens in this wallet yet</div>
      </div>
    );
  }

  const rawTotal = data.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
  const display = (Number(rawTotal) / 1_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Your MEME Balance</div>
      <div style={valueStyle}>{display}</div>
      <div style={subStyle}>MEME</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(74,222,128,0.06)",
  border: "1px solid rgba(74,222,128,0.2)",
  borderRadius: 16,
  padding: "24px 32px",
  display: "inline-block",
  minWidth: 240,
};

const labelStyle: React.CSSProperties = {
  color: "#4ade80",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 8,
};

const valueStyle: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 900,
  letterSpacing: "-1px",
  lineHeight: 1,
};

const subStyle: React.CSSProperties = {
  color: "#555",
  fontSize: 13,
  marginTop: 6,
};
