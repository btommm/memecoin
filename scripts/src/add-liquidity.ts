/**
 * Creates a MEME/SUI pool on Cetus testnet and adds initial liquidity.
 * Builds the transaction directly without the Cetus SDK's network calls.
 *
 * Usage: node --loader ts-node/esm src/add-liquidity.ts
 */

// Must be set before any imports that use fetch/https
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import Decimal from "decimal.js";
import BN from "bn.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../deployment.json");

// Cetus testnet contract addresses (from SDK source + on-chain query)
const CETUS = {
  clmmPublishedAt: "0x85e61285a10efc6602ab00df70a0c06357c384ef4c5633ecf73016df1500c704",
  globalConfig:    "0x9774e359588ead122af1c7e7f64e14ade261cfeecdb5d0eb4a5b3b4c8ab8bd3e",
  pools:           "0x50eb61dd5928cec5ea04711a2e9b72e5237e79e9fbcd2ce3d5469dc8708e0ee2",
};
const CLOCK = "0x0000000000000000000000000000000000000000000000000000000000000006";
const SUI_METADATA = "0xf256d3fb6a50eaa748d94335b34f2982fbc3b63ceec78cafaa29ebc9ebaf2bbc";

const SUI_TYPE  = "0x2::sui::SUI";
const SUI_DEC   = 9;
const MEME_DEC  = 6;

// 1 SUI = 10,000,000 MEME  →  price of SUI in MEME = 10_000_000
const PRICE_SUI_PER_MEME = 1 / 10_000_000; // price of coinA per coinB if SUI is coinA
const SEED_SUI  = 200_000_000n; // 0.2 SUI in MIST
const TICK_SPACING = 200;

// ── Minimal TickMath implementation ──────────────────────────────────────────

const Q64 = new Decimal(2).pow(64);

function toX64(n: Decimal): BN {
  return new BN(n.mul(Q64).floor().toFixed());
}

function priceToSqrtPriceX64(price: number, decA: number, decB: number): BN {
  const d = new Decimal(price).mul(Decimal.pow(10, decB - decA)).sqrt();
  return toX64(d);
}

// Tick index ↔ sqrt price (Uniswap v3 formula used by Cetus)
const MIN_TICK = -443636;
const MAX_TICK =  443636;

function prevInitTick(tick: number, spacing: number): number {
  return MIN_TICK + Math.abs(MIN_TICK) % spacing;
}
function nextInitTick(tick: number, spacing: number): number {
  return MAX_TICK - MAX_TICK % spacing;
}

// u32 as signed → unsigned (two's complement trick for negative ticks)
function asUintN32(n: bigint): bigint {
  return BigInt.asUintN(32, n);
}

// ─────────────────────────────────────────────────────────────────────────────

function loadKeypair(): Ed25519Keypair {
  const keystorePath = path.join(homedir(), ".sui", "sui_config", "sui.keystore");
  const keystore: string[] = JSON.parse(readFileSync(keystorePath, "utf8"));
  return Ed25519Keypair.fromSecretKey(Buffer.from(keystore[0], "base64").slice(1));
}

async function addLiquidity() {
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ deployment.json not found. Run npm run deploy first.");
    process.exit(1);
  }

  const { packageId } = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const MEME_TYPE = `${packageId}::shroom::SHROOM`;

  const keypair = loadKeypair();
  const sender  = keypair.getPublicKey().toSuiAddress();
  const client  = new SuiClient({ url: getFullnodeUrl("testnet") });

  // Fetch MEME metadata object ID
  const memeMeta = await client.getCoinMetadata({ coinType: MEME_TYPE });
  if (!memeMeta?.id) {
    console.error("❌ CoinMetadata for MEME not found.");
    process.exit(1);
  }

  // Cetus sorts coin types lexicographically — determine order
  const isSuiA = SUI_TYPE < MEME_TYPE;
  const [coinTypeA, coinTypeB] = isSuiA ? [SUI_TYPE, MEME_TYPE]  : [MEME_TYPE, SUI_TYPE];
  const [decA, decB]           = isSuiA ? [SUI_DEC,  MEME_DEC]   : [MEME_DEC,  SUI_DEC];
  const [metaA, metaB]         = isSuiA
    ? [SUI_METADATA, memeMeta.id]
    : [memeMeta.id,  SUI_METADATA];

  const price = isSuiA ? PRICE_SUI_PER_MEME : 1 / PRICE_SUI_PER_MEME;
  const initSqrtPrice = priceToSqrtPriceX64(price, decA, decB);

  const tickLower = prevInitTick(MIN_TICK, TICK_SPACING);
  const tickUpper = nextInitTick(MAX_TICK, TICK_SPACING);

  console.log(`\n💧 Creating MEME/SUI pool on Cetus testnet`);
  console.log(`   Wallet:      ${sender}`);
  console.log(`   coinTypeA:   ${coinTypeA}`);
  console.log(`   coinTypeB:   ${coinTypeB}`);
  console.log(`   Price:       1 SUI = 10,000,000 MEME`);
  console.log(`   Seed:        0.2 SUI\n`);

  // Fetch SUI coins to use
  const suiCoins = await client.getCoins({ owner: sender, coinType: SUI_TYPE });
  if (!suiCoins.data.length) {
    console.error("❌ No SUI in wallet.");
    process.exit(1);
  }

  // Fetch MEME coins
  const memeCoins = await client.getCoins({ owner: sender, coinType: MEME_TYPE });
  if (!memeCoins.data.length) {
    console.error("❌ No MEME in wallet. Run npm run mint first.");
    process.exit(1);
  }

  const tx = new Transaction();
  tx.setSender(sender);

  // Split exact SUI amount for the pool seed
  const [seedSui] = tx.splitCoins(tx.gas, [SEED_SUI]);

  // Split a small MEME amount for the other side (Cetus calculates exact ratio)
  const SEED_MEME = 10_000_000_000_000n; // 10M MEME
  let primaryMeme = tx.object(memeCoins.data[0].coinObjectId);
  if (memeCoins.data.length > 1) {
    tx.mergeCoins(primaryMeme, memeCoins.data.slice(1).map(c => tx.object(c.coinObjectId)));
  }
  const [seedMeme] = tx.splitCoins(primaryMeme, [SEED_MEME]);

  const [coinA, coinB] = isSuiA ? [seedSui, seedMeme] : [seedMeme, seedSui];
  const fixAmountA = isSuiA; // fix SUI amount, let MEME be calculated

  tx.moveCall({
    target: `${CETUS.clmmPublishedAt}::pool_creator::create_pool_v2`,
    typeArguments: [coinTypeA, coinTypeB],
    arguments: [
      tx.object(CETUS.globalConfig),
      tx.object(CETUS.pools),
      tx.pure.u32(TICK_SPACING),
      tx.pure.u128(initSqrtPrice.toString()),
      tx.pure.string(""),
      tx.pure.u32(Number(asUintN32(BigInt(tickLower)))),
      tx.pure.u32(Number(asUintN32(BigInt(tickUpper)))),
      coinA,
      coinB,
      tx.object(metaA),
      tx.object(metaB),
      tx.pure.bool(fixAmountA),
      tx.object(CLOCK),
    ],
  });

  console.log("⏳ Submitting transaction...");

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (result.effects?.status?.status !== "success") {
    console.error("❌ Transaction failed:", result.effects?.status?.error);
    process.exit(1);
  }

  const pool = result.objectChanges?.find(
    (c: any) => c.type === "created" && c.objectType?.includes("Pool<")
  ) as any;

  console.log("\n✅ Pool created!");
  console.log(`   Tx:      ${result.digest}`);
  if (pool) console.log(`   Pool ID: ${pool.objectId}`);
  console.log(`\n🔗 https://suiscan.xyz/testnet/tx/${result.digest}`);
}

addLiquidity().catch((err) => {
  console.error("\n❌ Error:", err?.message ?? String(err));
  if (err?.cause) console.error("Cause:", err.cause);
  process.exit(1);
});
