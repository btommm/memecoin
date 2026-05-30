# MEMECOIN on SUI

A meme coin on the SUI network. 1 trillion supply, Move smart contract, Next.js landing page.

---

## Step 1 — Install the SUI CLI

You have two options. **Option A is faster** (no Rust needed).

### Option A — Pre-built binary (recommended)

1. Go to: https://github.com/MystenLabs/sui/releases/latest
2. Download `sui-testnet-windows-x86_64.tgz` (or the latest Windows build)
3. Extract it — you'll get a `sui.exe`
4. Move `sui.exe` to a folder in your PATH (e.g., `C:\Users\Brandon\bin\`) and add that folder to your PATH environment variable
5. Open a new terminal and verify: `sui --version`

### Option B — Build from source (requires Rust ~15 min)

1. Install Rust: https://rustup.rs → run `rustup-init.exe`
2. Open a new terminal, then:
   ```
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
   ```

---

## Step 2 — Set up your wallet

```bash
# Create a new wallet address
sui client new-address ed25519

# Switch to testnet
sui client switch --env testnet

# Get free testnet SUI for gas
sui client faucet

# Check your balance
sui client balance
```

---

## Step 3 — Deploy the contract

```bash
cd C:\Users\Brandon\memecoin\scripts
npm run deploy
```

This builds the Move package and publishes it. Output is saved to `scripts/deployment.json`.

---

## Step 4 — Mint the full supply

```bash
npm run mint
```

Mints 1,000,000,000,000 MEME (1 trillion) to your wallet.

---

## Step 5 — Run the frontend

```bash
cd C:\Users\Brandon\memecoin\frontend
copy .env.local.example .env.local
```

Open `.env.local` and paste in your package ID from `deployment.json`:
```
NEXT_PUBLIC_PACKAGE_ID=0x_your_package_id_here
```

Then:
```bash
npm run dev
```

Open http://localhost:3000

---

## Step 6 — Add liquidity

Visit http://localhost:3000/liquidity for step-by-step instructions on creating a trading pool on Cetus or Turbos Finance.

Short version:
- Go to https://app.cetus.zone/liquidity/create
- Connect your SUI wallet
- Select MEME + SUI as the token pair
- Paste your coin type: `<PACKAGE_ID>::meme::MEME`
- Set an initial price and deposit both tokens

---

## Rename the coin

Edit these files to change MEME to your actual name:

| File | What to change |
|------|---------------|
| `move/sources/memecoin.move` | `struct MEME`, ticker `b"MEME"`, name `b"MEMECOIN"`, description |
| `move/Move.toml` | `name = "memecoin"` and `memecoin = "0x0"` |
| `frontend/src/app/page.tsx` | Hero text, emoji, tokenomics display |
| `frontend/src/components/Nav.tsx` | Logo text |

---

## Project structure

```
memecoin/
├── move/
│   ├── Move.toml                  SUI package config
│   └── sources/memecoin.move      Move smart contract
├── scripts/
│   ├── deployment.json            Created after deploy — holds package ID
│   └── src/
│       ├── deploy.ts              Publishes contract to testnet/mainnet
│       └── mint.ts                Mints 1T MEME to your wallet
└── frontend/
    ├── .env.local.example         Copy to .env.local, add your package ID
    └── src/
        ├── app/
        │   ├── layout.tsx         Wallet + query providers
        │   ├── page.tsx           Landing page
        │   └── liquidity/page.tsx Liquidity pool guide
        └── components/
            ├── Nav.tsx            Sticky nav with wallet connect
            └── TokenInfo.tsx      Shows wallet's MEME balance
```

---

## FAQ

**Why 6 decimals instead of 9?**
1 trillion × 10⁹ decimals exceeds u64. 1 trillion × 10⁶ = 10¹⁸ which fits safely in a u64.

**What is the TreasuryCap?**
A SUI object that grants minting permission. Whoever holds it can mint more MEME. After the initial mint, you can "renounce" it by transferring to address `0x0` — making the supply permanently fixed.

**How do I renounce the treasury cap?**
```bash
sui client call \
  --package 0x2 \
  --module transfer \
  --function public_freeze_object \
  --args <treasury-cap-id> \
  --gas-budget 10000000
```
