/**
 * Creates a MEME/SUI pool on Cetus testnet and adds initial liquidity.
 *
 * Usage: node --loader ts-node/esm src/add-liquidity.ts
 *
 * What this does:
 *   1. Creates a new CLMM pool with MEME and SUI as the token pair
 *   2. Sets the initial price: 1 SUI = 10,000,000 MEME
 *   3. Adds liquidity across the full price range so trades work at any price
 */
import { initTestnetSDK, TickMath, MIN_TICK_INDEX, MAX_TICK_INDEX } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import Decimal from "decimal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../deployment.json");

// Initial price: 1 SUI = 10,000,000 MEME
// SUI has 9 decimals, MEME has 6 decimals
// Price in terms of coinA (SUI) per coinB (MEME) = 1 / 10_000_000
const PRICE = 1 / 10_000_000;
const SUI_DECIMALS = 9;
const MEME_DECIMALS = 6;

// Amount of SUI to seed the pool with (0.2 SUI)
const SEED_SUI_AMOUNT = 200_000_000n; // 0.2 SUI in MIST

function loadKeypair(): Ed25519Keypair {
  const keystorePath = path.join(homedir(), ".sui", "sui_config", "sui.keystore");
  const keystore: string[] = JSON.parse(readFileSync(keystorePath, "utf8"));
  const raw = Buffer.from(keystore[0], "base64");
  return Ed25519Keypair.fromSecretKey(raw.slice(1));
}

async function addLiquidity() {
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ deployment.json not found. Run npm run deploy first.");
    process.exit(1);
  }

  const { packageId } = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const MEME_COIN_TYPE = `${packageId}::meme::MEME`;
  const SUI_COIN_TYPE = "0x2::sui::SUI";

  const keypair = loadKeypair();
  const sender = keypair.getPublicKey().toSuiAddress();

  const sdk = initTestnetSDK(getFullnodeUrl("testnet"), sender);
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  console.log("\n💧 Creating MEME/SUI liquidity pool on Cetus testnet");
  console.log(`   Wallet:    ${sender}`);
  console.log(`   MEME type: ${MEME_COIN_TYPE}`);
  console.log(`   Price:     1 SUI = 10,000,000 MEME\n`);

  // Cetus CLMM uses sqrt price in X64 fixed-point format
  // coinA = SUI, coinB = MEME  (sorted alphabetically by type string)
  // We need to determine which is coinA and coinB based on type sort order
  const [coinTypeA, coinTypeB] =
    SUI_COIN_TYPE < MEME_COIN_TYPE
      ? [SUI_COIN_TYPE, MEME_COIN_TYPE]
      : [MEME_COIN_TYPE, SUI_COIN_TYPE];

  const isSuiA = coinTypeA === SUI_COIN_TYPE;

  // Price of coinA in terms of coinB
  const price = isSuiA ? PRICE : 1 / PRICE;
  const [decimalsA, decimalsB] = isSuiA
    ? [SUI_DECIMALS, MEME_DECIMALS]
    : [MEME_DECIMALS, SUI_DECIMALS];

  const initSqrtPrice = TickMath.priceToSqrtPriceX64(
    new Decimal(price),
    decimalsA,
    decimalsB
  );

  // Full range: min tick to max tick (simplest for a new pool)
  const tickSpacing = 200;
  const tickLower = TickMath.getPrevInitializableTickIndex(MIN_TICK_INDEX, tickSpacing);
  const tickUpper = TickMath.getNextInitializableTickIndex(MAX_TICK_INDEX, tickSpacing);

  const [amountA, amountB] = isSuiA
    ? [SEED_SUI_AMOUNT, undefined]
    : [undefined, SEED_SUI_AMOUNT];

  console.log("⏳ Building pool creation transaction...");

  let tx: any;
  try {
    tx = await sdk.Pool.createPoolTransactionPayload({
      coinTypeA,
      coinTypeB,
      tick_spacing: tickSpacing,
      initialize_sqrt_price: initSqrtPrice.toString(),
      uri: "",
      amount_a: amountA?.toString() ?? "0",
      amount_b: amountB?.toString() ?? "0",
      fix_amount_a: isSuiA,
      tick_lower: tickLower,
      tick_upper: tickUpper,
      metadata_a: "",
      metadata_b: "",
      slippage: 0.05,
    });
  } catch (err: any) {
    console.error("❌ Failed to build transaction:", err.message ?? err);
    process.exit(1);
  }

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

  // Find the created pool object
  const pool = result.objectChanges?.find(
    (c: any) => c.type === "created" && c.objectType?.includes("Pool<")
  ) as any;

  console.log("\n✅ Pool created and liquidity added!");
  console.log(`   Tx digest: ${result.digest}`);
  if (pool) console.log(`   Pool ID:   ${pool.objectId}`);
  console.log(`\n🔗 View on explorer:`);
  console.log(`   https://suiscan.xyz/testnet/tx/${result.digest}`);
  console.log(`\n💱 Trade on Cetus testnet:`);
  console.log(`   https://app.cetus.zone/swap`);
}

addLiquidity().catch((err) => {
  console.error("❌ Unexpected error:", err.message ?? err);
  process.exit(1);
});
