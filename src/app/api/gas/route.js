// Next.js API route: /api/gas?chain=ethereum|polygon|arbitrum
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get('chain');
  const RPC_URLS = {
    ethereum: "https://eth-mainnet.g.alchemy.com/v2/0w0Hzs_3iyRBxLGr6Epqh",
    polygon: "https://polygon-mainnet.g.alchemy.com/v2/0w0Hzs_3iyRBxLGr6Epqh",
    arbitrum: "https://arb-mainnet.g.alchemy.com/v2/0w0Hzs_3iyRBxLGr6Epqh",
  };
  if (!chain || !RPC_URLS[chain]) {
    return new Response(JSON.stringify({ error: 'Invalid chain' }), { status: 400 });
  }
  try {
    const res = await fetch(RPC_URLS[chain], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      }),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Upstream error', status: res.status }), { status: res.status });
    }
    const json = await res.json();
    const block = json.result;
    return new Response(
      JSON.stringify({
        baseFee: parseInt(block.baseFeePerGas || '0', 16) / 1e9, // Gwei
        priorityFee: 2, // Placeholder
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 