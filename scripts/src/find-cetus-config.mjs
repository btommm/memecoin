import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const CETUS_CLMM_PACKAGE = "0x0c7ae833c220aa73a3643a0d508afa4ac5d50d97312ea4584e35f9eb21b9df12";
const CETUS_CONFIG_PACKAGE = "0xf5ff7d5ba73b581bca6b4b9fa0049cd320360abd154b809f8700a8fd3cfaf7ca";

async function main() {
  // Search for GlobalConfig object
  const globalConfig = await client.queryEvents({
    query: { MoveEventType: `${CETUS_CLMM_PACKAGE}::factory::InitFactoryEvent` },
    limit: 5,
  });
  console.log("InitFactoryEvent:", JSON.stringify(globalConfig.data, null, 2));

  // Try fetching owned objects by the cetus package
  const objects = await client.queryEvents({
    query: { MoveEventType: `${CETUS_CONFIG_PACKAGE}::config::InitConfigEvent` },
    limit: 5,
  });
  console.log("InitConfigEvent:", JSON.stringify(objects.data, null, 2));
}

main().catch(console.error);
