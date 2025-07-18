import { id, Interface } from "ethers";

// Uniswap V3 ETH/USDC pool address
const UNISWAP_POOL = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";

// Swap event topic
const SWAP_TOPIC = id("Swap(address,address,int256,int256,uint160,uint128,int24)");

const iface = new Interface([
  "event Swap(address,address,int256,int256,uint160,uint128,int24)"
]);

export async function fetchEthUsdPrice(provider) {
  try {
    const latestBlock = await provider.getBlockNumber();
    const logs = await provider.getLogs({
      address: UNISWAP_POOL,
      topics: [SWAP_TOPIC],
      fromBlock: latestBlock - 499,
      toBlock: latestBlock,
    });
    if (!logs.length) return null;

    // Try to parse logs in reverse order, return the first valid one
    for (let i = logs.length - 1; i >= 0; i--) {
      try {
        const parsed = iface.parseLog(logs[i]);
        const sqrtPriceX96 = parsed.args[4];
        // Price formula
        const price = (sqrtPriceX96 ** 2 * 1e12) / 2 ** 192;
        return Number(price);
      } catch (err) {
        // Not a valid Swap event, skip
        continue;
      }
    }
    return null;
  } catch (err) {
    console.error("Error fetching ETH/USD price from Uniswap:", err);
    return null;
  }
} 