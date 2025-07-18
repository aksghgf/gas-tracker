import { JsonRpcProvider } from "ethers";

export const RPC_URLS = {
  ethereum: "https://eth-mainnet.g.alchemy.com/v2/8VAuVVoBNk8HypSpcd0_yFknvetva41s",
  polygon: "https://polygon-mainnet.g.alchemy.com/v2/8VAuVVoBNk8HypSpcd0_yFknvetva41s",
  arbitrum: "https://arb-mainnet.g.alchemy.com/v2/8VAuVVoBNk8HypSpcd0_yFknvetva41s",
};

export function getProvider(chain) {
  return new JsonRpcProvider(RPC_URLS[chain]);
} 