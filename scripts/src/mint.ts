/**
 * Mints the full 1 trillion MEME supply to the deployer's wallet.
 *
 * Usage:
 *   npm run mint
 *
 * Reads packageId and treasuryCapId from deployment.json (written by deploy.ts).
 * Uses the first keypair in your SUI keystore (~/.sui/sui_config/sui.keystore).
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../deployment.json");

// 1 trillion tokens × 10^6 (6 decimals) — fits in u64
const TOTAL_SUPPLY = 1_000_000_000_000n * 1_000_000n;

function loadKeypair(): Ed25519Keypair {
  const keystorePath = path.join(homedir(), ".sui", "sui_config", "sui.keystore");
  if (!existsSync(keystorePath)) {
    console.error(
      "❌ SUI keystore not found at:", keystorePath,
      "\n   Run `sui client new-address ed25519` to create one."
    );
    process.exit(1);
  }
  const keystore: string[] = JSON.parse(readFileSync(keystorePath, "utf8"));
  if (!keystore.length) {
    console.error("❌ Keystore is empty. Run: sui client new-address ed25519");
    process.exit(1);
  }
  // First byte is the key scheme flag — strip it
  const raw = Buffer.from(keystore[0], "base64");
  return Ed25519Keypair.fromSecretKey(raw.slice(1));
}

async function mint() {
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ deployment.json not found. Run `npm run deploy` first.");
    process.exit(1);
  }

  const deployment = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const { packageId, treasuryCapId, network } = deployment;

  if (!packageId || !treasuryCapId || treasuryCapId === "unknown — check sui explorer") {
    console.error("❌ Missing packageId or treasuryCapId in deployment.json.");
    console.error("   Find the TreasuryCap object ID on the explorer and add it manually.");
    process.exit(1);
  }

  const keypair = loadKeypair();
  const sender = keypair.getPublicKey().toSuiAddress();

  const client = new SuiClient({ url: getFullnodeUrl(network ?? "testnet") });

  console.log(`\n🍄 Minting SHROOM tokens`);
  console.log(`   Network:     ${network ?? "testnet"}`);
  console.log(`   Package:     ${packageId}`);
  console.log(`   TreasuryCap: ${treasuryCapId}`);
  console.log(`   Recipient:   ${sender}`);
  console.log(`   Amount:      ${(Number(TOTAL_SUPPLY) / 1e6).toLocaleString()} SHROOM\n`);

  // Check wallet has SUI for gas
  const coins = await client.getCoins({ owner: sender, coinType: "0x2::sui::SUI" });
  if (!coins.data.length) {
    console.error("❌ No SUI for gas. Run: sui client faucet");
    process.exit(1);
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::shroom::mint`,
    arguments: [
      tx.object(treasuryCapId),
      tx.pure.u64(TOTAL_SUPPLY),
      tx.pure.address(sender),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (result.effects?.status?.status !== "success") {
    console.error("❌ Transaction failed:", result.effects?.status?.error);
    process.exit(1);
  }

  console.log("✅ Mint successful!");
  console.log(`   Tx digest: ${result.digest}`);
  console.log(`   Minted:    ${(Number(TOTAL_SUPPLY) / 1e6).toLocaleString()} SHROOM`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Add NEXT_PUBLIC_PACKAGE_ID=${packageId} to frontend/.env.local`);
  console.log(`   2. Run the frontend: cd ../frontend && npm run dev`);
  console.log(`   3. Add liquidity on Cetus or Turbos Finance\n`);
}

mint().catch((err) => {
  console.error("❌ Unexpected error:", err.message ?? err);
  process.exit(1);
});
