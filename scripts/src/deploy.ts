/**
 * Deploys the MEME coin contract to SUI testnet (or mainnet).
 *
 * Usage:
 *   npm run deploy              → deploys to testnet (default)
 *   NETWORK=mainnet npm run deploy
 *
 * Prerequisites:
 *   1. SUI CLI installed and configured
 *   2. Run `sui client switch --env testnet` first
 *   3. Have testnet SUI for gas — get free from: sui client faucet
 */
import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVE_DIR = path.resolve(__dirname, "../../move");
const CONFIG_PATH = path.resolve(__dirname, "../deployment.json");
const NETWORK = process.env.NETWORK ?? "testnet";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] });
}

function deploy() {
  // Check SUI CLI exists
  try {
    run("sui --version");
  } catch {
    console.error(
      "\n❌ SUI CLI not found.\n\n" +
      "Install it:\n" +
      "  Option A (pre-built): Download from https://github.com/MystenLabs/sui/releases\n" +
      "                         Add the binary to your PATH.\n" +
      "  Option B (cargo):     cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui\n"
    );
    process.exit(1);
  }

  // Check active env
  let activeEnv = "";
  try {
    const envOut = run("sui client active-env");
    activeEnv = envOut.trim();
  } catch {
    console.error("❌ Could not detect active SUI environment. Run: sui client switch --env testnet");
    process.exit(1);
  }

  if (!activeEnv.includes(NETWORK)) {
    console.warn(`⚠️  Active env is "${activeEnv}" but NETWORK is "${NETWORK}". Proceeding anyway...`);
  }

  // Warn before mainnet deploy
  if (NETWORK === "mainnet") {
    console.log("\n⚠️  MAINNET DEPLOY — this uses real SUI and costs real money.");
    console.log("   Press Ctrl+C within 5 seconds to cancel...\n");
    const start = Date.now();
    while (Date.now() - start < 5000) { /* wait */ }
  }

  console.log(`\n🚀 Deploying MEME coin to ${NETWORK}...\n`);

  let output: string;
  try {
    output = run(`sui client publish --gas-budget 200000000 "${MOVE_DIR}" --json`);
  } catch (err: any) {
    console.error("❌ Deploy failed:\n", err.stderr ?? err.message);
    process.exit(1);
  }

  // Parse JSON output from sui client publish --json
  let parsed: any;
  try {
    parsed = JSON.parse(output);
  } catch {
    // Fallback: parse from raw output
    console.log("Raw output:\n", output);
    console.error("❌ Could not parse JSON output. Check above for package ID manually.");
    process.exit(1);
  }

  // Extract package ID
  const packageId: string =
    parsed?.objectChanges?.find((c: any) => c.type === "published")?.packageId ??
    parsed?.effects?.created?.find((c: any) => c.owner === "Immutable")?.reference?.objectId;

  if (!packageId) {
    console.log("Full output:", JSON.stringify(parsed, null, 2));
    console.error("❌ Could not extract package ID. See full output above.");
    process.exit(1);
  }

  // Extract TreasuryCap object ID
  const treasuryCapId: string =
    parsed?.objectChanges?.find(
      (c: any) => c.type === "created" && c.objectType?.includes("TreasuryCap")
    )?.objectId ?? "unknown — check sui explorer";

  const deployment = {
    packageId,
    treasuryCapId,
    coinType: `${packageId}::meme::MEME`,
    network: NETWORK,
    deployedAt: new Date().toISOString(),
    txDigest: parsed?.digest ?? "unknown",
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(deployment, null, 2));

  console.log("\n✅ Deploy successful!\n");
  console.log(`   Package ID:   ${packageId}`);
  console.log(`   TreasuryCap:  ${treasuryCapId}`);
  console.log(`   Tx digest:    ${deployment.txDigest}`);
  console.log(`\n   Saved to: deployment.json`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Run: npm run mint`);
  console.log(`   2. Add NEXT_PUBLIC_PACKAGE_ID=${packageId} to frontend/.env.local`);
  console.log(`   3. View on explorer: https://suiscan.xyz/${NETWORK}/object/${packageId}\n`);
}

deploy();
