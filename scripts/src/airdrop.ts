/**
 * Airdrops MEME tokens to a list of wallet addresses.
 *
 * Usage:
 *   node --loader ts-node/esm src/airdrop.ts
 *   node --loader ts-node/esm src/airdrop.ts --dry-run   (preview without sending)
 *
 * Edit airdrop-list.json before running:
 *   [
 *     { "address": "0x...", "amount": 1000000 },  ← amount in whole MEME (not raw)
 *     { "address": "0x...", "amount": 500000 }
 *   ]
 *
 * SUI lets us batch up to ~500 transfers per transaction using PTBs.
 * This script splits into batches automatically so any list size works.
 */
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../deployment.json");
const LIST_PATH = path.resolve(__dirname, "../airdrop-list.json");
const RECEIPT_PATH = path.resolve(__dirname, "../airdrop-receipt.json");

const DECIMALS = 6;
const BATCH_SIZE = 100; // transfers per transaction
const DRY_RUN = process.argv.includes("--dry-run");

interface AirdropEntry {
  address: string;
  amount: number; // whole MEME tokens
}

function loadKeypair(): Ed25519Keypair {
  const keystorePath = path.join(homedir(), ".sui", "sui_config", "sui.keystore");
  const keystore: string[] = JSON.parse(readFileSync(keystorePath, "utf8"));
  const raw = Buffer.from(keystore[0], "base64");
  return Ed25519Keypair.fromSecretKey(raw.slice(1));
}

function toRaw(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** DECIMALS));
}

function validateList(list: AirdropEntry[]): void {
  const seen = new Set<string>();
  for (const entry of list) {
    if (!entry.address.startsWith("0x") || entry.address.length < 10) {
      throw new Error(`Invalid address: ${entry.address}`);
    }
    if (entry.amount <= 0) {
      throw new Error(`Amount must be > 0 for ${entry.address}`);
    }
    if (seen.has(entry.address)) {
      throw new Error(`Duplicate address: ${entry.address}`);
    }
    seen.add(entry.address);
  }
}

async function runBatch(
  client: SuiClient,
  keypair: Ed25519Keypair,
  coinType: string,
  entries: AirdropEntry[],
  allCoins: any[],
  batchNum: number,
  totalBatches: number
): Promise<string> {
  const tx = new Transaction();

  // Merge all MEME coins into one if there are multiple objects
  let primaryCoin = tx.object(allCoins[0].coinObjectId);
  if (allCoins.length > 1) {
    tx.mergeCoins(
      primaryCoin,
      allCoins.slice(1).map((c) => tx.object(c.coinObjectId))
    );
  }

  // Split exact amounts for each recipient and transfer in one PTB
  for (const entry of entries) {
    const [splitCoin] = tx.splitCoins(primaryCoin, [toRaw(entry.amount)]);
    tx.transferObjects([splitCoin], entry.address);
  }

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(`Batch ${batchNum} failed: ${result.effects?.status?.error}`);
  }

  return result.digest;
}

async function airdrop() {
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ deployment.json not found. Run npm run deploy first.");
    process.exit(1);
  }
  if (!existsSync(LIST_PATH)) {
    console.error("❌ airdrop-list.json not found.");
    process.exit(1);
  }

  const { packageId, network } = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const coinType = `${packageId}::meme::MEME`;
  const list: AirdropEntry[] = JSON.parse(readFileSync(LIST_PATH, "utf8"));

  // Validate
  try {
    validateList(list);
  } catch (err: any) {
    console.error("❌ Invalid airdrop list:", err.message);
    process.exit(1);
  }

  const totalMeme = list.reduce((s, e) => s + e.amount, 0);
  const batches = Math.ceil(list.length / BATCH_SIZE);

  console.log(`\n🪂 MEME Airdrop${DRY_RUN ? " (DRY RUN)" : ""}`);
  console.log(`   Recipients: ${list.length}`);
  console.log(`   Total MEME: ${totalMeme.toLocaleString()}`);
  console.log(`   Batches:    ${batches} (${BATCH_SIZE} per tx)`);
  console.log(`   Network:    ${network ?? "testnet"}\n`);

  if (DRY_RUN) {
    console.log("Recipients:");
    list.forEach((e) => console.log(`  ${e.address}  →  ${e.amount.toLocaleString()} MEME`));
    console.log("\n✅ Dry run complete. Run without --dry-run to send.");
    return;
  }

  const keypair = loadKeypair();
  const sender = keypair.getPublicKey().toSuiAddress();
  const client = new SuiClient({ url: getFullnodeUrl(network ?? "testnet") });

  // Check sender's MEME balance
  const coins = await client.getCoins({ owner: sender, coinType });
  if (!coins.data.length) {
    console.error("❌ No MEME tokens in wallet. Run npm run mint first.");
    process.exit(1);
  }

  const balance = coins.data.reduce((s, c) => s + BigInt(c.balance), 0n);
  const needed = BigInt(Math.round(totalMeme * 10 ** DECIMALS));
  if (balance < needed) {
    console.error(
      `❌ Insufficient balance. Have ${(Number(balance) / 1e6).toLocaleString()} MEME, need ${totalMeme.toLocaleString()}`
    );
    process.exit(1);
  }

  const receipts: { address: string; amount: number; batch: number; digest: string }[] = [];

  for (let i = 0; i < batches; i++) {
    const batch = list.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    console.log(`⏳ Sending batch ${i + 1}/${batches} (${batch.length} recipients)...`);

    // Re-fetch coins each batch so we have fresh object versions
    const freshCoins = await client.getCoins({ owner: sender, coinType });

    try {
      const digest = await runBatch(client, keypair, coinType, batch, freshCoins.data, i + 1, batches);
      console.log(`   ✅ Batch ${i + 1} done — tx: ${digest}`);
      batch.forEach((e) => receipts.push({ ...e, batch: i + 1, digest }));
    } catch (err: any) {
      console.error(`   ❌ Batch ${i + 1} failed:`, err.message);
      console.error("   Saving progress so far to airdrop-receipt.json...");
      writeFileSync(RECEIPT_PATH, JSON.stringify(receipts, null, 2));
      process.exit(1);
    }
  }

  writeFileSync(RECEIPT_PATH, JSON.stringify(receipts, null, 2));

  console.log(`\n✅ Airdrop complete!`);
  console.log(`   Sent to ${receipts.length} wallets`);
  console.log(`   Total: ${totalMeme.toLocaleString()} MEME`);
  console.log(`   Receipt saved to: airdrop-receipt.json\n`);
}

airdrop().catch((err) => {
  console.error("❌ Unexpected error:", err.message ?? err);
  process.exit(1);
});
