# MEMECOIN on SUI

A meme coin launched on the SUI network. 1 trillion supply, Move smart contract, Next.js landing page with Phantom + Sui Wallet support.

---

## What's been built

| Component | Status | Details |
|-----------|--------|---------|
| Move smart contract | ✅ Done | `move/sources/memecoin.move` |
| Deployed to testnet | ✅ Done | See contract addresses below |
| 1T MEME minted | ✅ Done | All in deployer wallet |
| Deploy script | ✅ Done | `scripts/src/deploy.ts` |
| Mint script | ✅ Done | `scripts/src/mint.ts` |
| Liquidity script | ✅ Done | `scripts/src/add-liquidity.ts` |
| Landing page | ✅ Done | Next.js + Phantom + Sui Wallet |
| Liquidity guide page | ✅ Done | `/liquidity` route |

---

## Testnet contract addresses

| Object | ID |
|--------|----|
| Package | `0x8257d623d1f1721e9aa1de8dc5a45c3cff8e7fc4ae4548fb61c573f571b7dd86` |
| TreasuryCap | `0x5f541d1e70a01d52d452a472e076b1b1091f9ab266d9e17acfa5e1f7fa7239a8` |
| Coin Type | `0x8257d623d1f1721e9aa1de8dc5a45c3cff8e7fc4ae4548fb61c573f571b7dd86::meme::MEME` |

View on explorer: https://suiscan.xyz/testnet/object/0x8257d623d1f1721e9aa1de8dc5a45c3cff8e7fc4ae4548fb61c573f571b7dd86

---

## What's left to do

### 1. Name the coin
Replace the MEME placeholder with your actual coin name and ticker throughout:
- `move/sources/memecoin.move` — struct name, `b"MEME"`, `b"MEMECOIN"`, description
- `move/Move.toml` — package name
- `frontend/src/app/page.tsx` — hero title, emoji, tagline
- `frontend/src/components/Nav.tsx` — logo text

After renaming you'll need to redeploy (`npm run deploy`) and remint (`npm run mint`).

### 2. Add a coin icon
- Add an image to `frontend/public/logo.png`
- Pass the URL to `coin::create_currency` in the Move contract (`option::some(url::new_unsafe_from_bytes(b"https://..."))`)
- Also update the `<head>` favicon in `frontend/src/app/layout.tsx`

### 3. Add liquidity on testnet (practice run)
The script `scripts/src/add-liquidity.ts` is ready. It creates a MEME/SUI pool on Cetus with an initial price of 1 SUI = 10,000,000 MEME.

The Cetus testnet API is intermittently unreliable — if the script fails with "fetch failed", try again later or use the Cetus testnet UI:
1. Go to https://app.cetus.zone (connect a testnet wallet)
2. Pools → Create Pool
3. Coin type: `0x8257d623...b7dd86::meme::MEME` (full type in `scripts/deployment.json`)

### 4. Deploy to mainnet
When ready to go live with real money:
```bash
# Switch CLI to mainnet
sui client switch --env mainnet

# You'll need real SUI in your wallet for gas + liquidity
# Deploy
cd scripts
NETWORK=mainnet npm run deploy

# Mint
npm run mint

# Add liquidity (Cetus mainnet API is stable)
node --loader ts-node/esm src/add-liquidity.ts
```
Update `frontend/.env.local` with the new mainnet package ID, then redeploy the frontend.

### 5. Deploy the frontend publicly
Options:
- **Vercel** (easiest): `npm i -g vercel && vercel` from `frontend/` — add `NEXT_PUBLIC_PACKAGE_ID` as an env var in the Vercel dashboard
- **Netlify**: similar, connect the GitHub repo and set the env var
- Point a custom domain at it

### 6. Renounce the TreasuryCap (trust signal)
After the full supply is minted, burn the mint authority so no more tokens can ever be created:
```bash
sui client call \
  --package 0x2 \
  --module transfer \
  --function public_freeze_object \
  --args 0x5f541d1e70a01d52d452a472e076b1b1091f9ab266d9e17acfa5e1f7fa7239a8 \
  --gas-budget 10000000
```

---

## Running locally

### Prerequisites
- Node.js 18+
- SUI CLI at `C:\Users\Brandon\sui-bin\sui.exe`

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # add NEXT_PUBLIC_PACKAGE_ID
npm run dev
# → http://localhost:3000
```

### Scripts
```bash
cd scripts
npm install
npm run deploy    # publish contract
npm run mint      # mint 1T MEME to wallet
node --loader ts-node/esm src/add-liquidity.ts  # create Cetus pool
```

---

## Project structure

```
memecoin/
├── move/
│   ├── Move.toml                  SUI package config
│   └── sources/memecoin.move      Move smart contract
├── scripts/
│   ├── deployment.json            Package ID + TreasuryCap (gitignored)
│   └── src/
│       ├── deploy.ts              Publishes contract
│       ├── mint.ts                Mints full supply
│       └── add-liquidity.ts       Creates Cetus CLMM pool
└── frontend/
    ├── .env.local                 NEXT_PUBLIC_PACKAGE_ID (gitignored)
    └── src/
        ├── app/
        │   ├── page.tsx           Landing page
        │   └── liquidity/page.tsx Liquidity guide
        └── components/
            ├── Nav.tsx            Sticky nav
            └── TokenInfo.tsx      Wallet balance display
```
