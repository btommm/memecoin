# SHROOM — The Dankest Mushroom on SUI

A meme coin launched on the SUI network. 1 trillion supply, Move smart contract, Next.js landing page with Phantom + Sui Wallet support, and a full social media campaign playbook.

---

## What's been built

| Component | Status | Details |
|-----------|--------|---------|
| Move smart contract | ✅ Done | `move/sources/shroomcoin.move` |
| Deploy script | ✅ Done | `scripts/src/deploy.ts` |
| Mint script | ✅ Done | `scripts/src/mint.ts` |
| Airdrop script | ✅ Done | `scripts/src/airdrop.ts` |
| Liquidity script | ✅ Done | `scripts/src/add-liquidity.ts` |
| Landing page | ✅ Done | Next.js + Phantom + Sui Wallet |
| Liquidity guide page | ✅ Done | `/liquidity` route |
| Mushroom logo (SVG) | ✅ Done | `frontend/public/logo.svg` |
| Social media campaign | ✅ Done | `marketing/` folder |
| Deployed to testnet | ⏳ Pending | Needs redeploy after SHROOM rename |

---

## Contract

**Token:** SHROOM  
**Ticker:** $SHROOM  
**Network:** SUI  
**Supply:** 1,000,000,000,000  
**Decimals:** 6  
**Tax:** 0%

> After rename + redeploy, update this section with the new package ID and TreasuryCap.

---

## What's left to do

### 1. Redeploy the SHROOM contract

The contract has been renamed from MEME → SHROOM. The old testnet deploy used the old name. Redeploy to get a fresh package ID:

```bash
# Make sure SUI CLI points to testnet
C:\Users\Brandon\sui-bin\sui.exe client switch --env testnet

# Deploy
cd scripts
npm run deploy

# Mint 1 trillion SHROOM to your wallet
npm run mint
```

Update `frontend/.env.local` with the new `NEXT_PUBLIC_PACKAGE_ID`.

### 2. Add an on-chain icon URL (optional but nice)

In `move/sources/shroomcoin.move`, replace `option::none()` with:
```move
option::some(url::new_unsafe_from_bytes(b"https://yourdomain.com/logo.svg"))
```

Add `use sui::url;` at the top. This makes the logo show up natively in SuiScan and wallets.

### 3. Add testnet liquidity (practice run)

The script `scripts/src/add-liquidity.ts` creates a SHROOM/SUI pool on Cetus with an initial price of 1 SUI = 10,000,000 SHROOM.

Note: Cetus testnet has a compatibility issue with the SUI testnet's updated CoinMetadata format. If the script fails, use the Cetus testnet UI:
1. Go to https://app.cetus.zone
2. Pools → Create Pool
3. Coin type: your new `::shroom::SHROOM` type from `scripts/deployment.json`

### 4. Deploy to mainnet

```bash
# Switch CLI to mainnet
C:\Users\Brandon\sui-bin\sui.exe client switch --env mainnet

# Fund the wallet with real SUI (for gas + liquidity)
# Deploy
cd scripts
NETWORK=mainnet npm run deploy

# Mint
npm run mint

# Add liquidity (Cetus mainnet works correctly)
node --loader ts-node/esm src/add-liquidity.ts
```

Update `frontend/.env.local` with the mainnet package ID.

### 5. Deploy the frontend publicly

```bash
# Vercel (easiest)
cd frontend
npx vercel
# Set NEXT_PUBLIC_PACKAGE_ID as env var in Vercel dashboard
```

Or use Netlify — connect the GitHub repo, set env var, done.

### 6. Renounce the TreasuryCap

After full supply is minted, freeze the mint authority so no more tokens can be created:

```bash
C:\Users\Brandon\sui-bin\sui.exe client call \
  --package 0x2 \
  --module transfer \
  --function public_freeze_object \
  --args <TREASURY_CAP_ID> \
  --gas-budget 10000000
```

Find `<TREASURY_CAP_ID>` in `scripts/deployment.json`.

### 7. Launch social media campaign

See `marketing/` folder:
- `content-calendar.md` — pre-launch through post-launch schedule
- `twitter-launch-threads.md` — ready-to-post Twitter threads
- `tiktok-scripts.md` — 5 video scripts
- `telegram-setup.md` — community setup checklist + pinned messages

---

## Running locally

### Prerequisites
- Node.js 18+
- SUI CLI at `C:\Users\Brandon\sui-bin\sui.exe`

### Frontend
```bash
cd frontend
npm install
# Create .env.local with:
# NEXT_PUBLIC_PACKAGE_ID=<your-package-id>
npm run dev
# → http://localhost:3000
```

### Scripts
```bash
cd scripts
npm install
npm run deploy              # publish contract to testnet
npm run mint                # mint 1T SHROOM to wallet
npm run airdrop -- --dry-run  # preview airdrop list
npm run airdrop             # execute airdrop
node --loader ts-node/esm src/add-liquidity.ts  # create Cetus pool
```

---

## Project structure

```
memecoin/
├── move/
│   ├── Move.toml                    SUI package config (name: shroomcoin)
│   └── sources/shroomcoin.move      Move smart contract
├── scripts/
│   ├── deployment.json              Package ID + TreasuryCap (gitignored)
│   ├── airdrop-list.json            Airdrop recipient list
│   └── src/
│       ├── deploy.ts                Publishes contract
│       ├── mint.ts                  Mints full supply
│       ├── airdrop.ts               Batch token airdrop
│       └── add-liquidity.ts         Creates Cetus CLMM pool
├── frontend/
│   ├── public/logo.svg              Mushroom logo (purple/fuchsia SVG)
│   ├── .env.local                   NEXT_PUBLIC_PACKAGE_ID (gitignored)
│   └── src/
│       ├── app/
│       │   ├── page.tsx             Landing page
│       │   ├── layout.tsx           HTML shell + wallet providers
│       │   └── liquidity/page.tsx   Liquidity guide
│       └── components/
│           ├── Nav.tsx              Sticky nav with logo
│           └── TokenInfo.tsx        Wallet balance display
└── marketing/
    ├── content-calendar.md          Launch schedule
    ├── twitter-launch-threads.md    Ready-to-post threads
    ├── tiktok-scripts.md            5 TikTok video scripts
    └── telegram-setup.md            Community setup guide
```

---

## Windows notes

- SUI CLI is at `C:\Users\Brandon\sui-bin\sui.exe` — not in PATH by default. Use full path or add to PATH.
- Node.js scripts use `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` to work around Windows SSL cert validation issues with the SUI RPC.
- SUI testnet faucet: https://faucet.sui.io (CLI faucet is disabled)
