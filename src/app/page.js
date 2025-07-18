"use client";
import { useEffect, useState } from "react";
import { getProvider } from "../utils/web3";
import { useGasStore } from "../store/gasStore";
import { fetchEthUsdPrice } from "../utils/uniswap";
import GasChart from "../components/GasChart";

const CHAINS = ["ethereum", "polygon", "arbitrum"];

export default function HomePage() {
  const setChainData = useGasStore((s) => s.setChainData);
  const setUsdPrice = useGasStore((s) => s.setUsdPrice);
  const { chains, usdPrice } = useGasStore();
  const [mode, setMode] = useState("live");
  const [amount, setAmount] = useState(0.5); // default 0.5 ETH
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll for new blocks and update gas data every 6 seconds
  useEffect(() => {
    if (!mounted) return;
    let interval;
    const fetchGasData = async () => {
      for (const chain of CHAINS) {
        try {
          const res = await fetch(`/api/gas?chain=${chain}`);
          if (!res.ok) continue;
          const data = await res.json();
          setChainData(chain, {
            baseFee: data.baseFee,
            priorityFee: data.priorityFee,
          });
        } catch (err) {
          // ignore
        }
      }
    };
    fetchGasData();
    interval = setInterval(fetchGasData, 6000);
    return () => clearInterval(interval);
  }, [setChainData, mounted]);

  // Live ETH/USD price updates
  useEffect(() => {
    if (!mounted) return;
    const provider = getProvider("ethereum");
    let interval;
    const fetchPrice = async () => {
      const price = await fetchEthUsdPrice(provider);
      if (price) setUsdPrice(price);
    };
    fetchPrice();
    interval = setInterval(fetchPrice, 6000);
    return () => clearInterval(interval);
  }, [setUsdPrice, mounted]);

  // Calculate USD cost for each chain
  const calcCost = (chain) => {
    const { baseFee, priorityFee } = chains[chain];
    return ((baseFee + priorityFee) * 21000 * usdPrice * amount).toFixed(2);
  };

  if (!mounted) return null;

  // --- Candlestick aggregation for ethereum chain ---
  function aggregateCandles(history, intervalMs = 15 * 60 * 1000) {
    if (!history || history.length === 0) return [];
    // Sort by timestamp just in case
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const candles = [];
    let candle = null;
    let candleStart = null;
    let count = 0;
    for (const entry of sorted) {
      const t = Math.floor(entry.timestamp / intervalMs) * intervalMs;
      if (candleStart === null || t !== candleStart) {
        if (candle && count > 0) candles.push(candle);
        candleStart = t;
        candle = {
          time: Math.floor(t / 1000),
          open: entry.baseFee,
          high: entry.baseFee,
          low: entry.baseFee,
          close: entry.baseFee,
        };
        count = 1;
      } else {
        candle.high = Math.max(candle.high, entry.baseFee);
        candle.low = Math.min(candle.low, entry.baseFee);
        candle.close = entry.baseFee;
        count++;
      }
    }
    if (candle && count > 0) candles.push(candle);
    return candles;
  }

  // Use ethereum chain for the chart
  const ethHistory = chains.ethereum.history;
  const ethCandles = aggregateCandles(ethHistory);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gas Tracker Home</h1>
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${mode === "live" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("live")}
        >
          Live Mode
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "simulation" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("simulation")}
        >
          Simulation Mode
        </button>
      </div>
      {mode === "simulation" && (
        <div className="mb-4">
          <label className="mr-2">Amount (ETH):</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="border px-2 py-1 rounded"
            min={0}
            step={0.01}
          />
        </div>
      )}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Current Gas Data</h2>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2">Chain</th>
              <th className="border px-2">Base Fee (Gwei)</th>
              <th className="border px-2">Priority Fee (Gwei)</th>
              <th className="border px-2">ETH/USD</th>
              <th className="border px-2">Tx Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(chains).map(chain => (
              <tr key={chain}>
                <td className="border px-2">{chain}</td>
                <td className="border px-2">{chains[chain].baseFee.toFixed(2)}</td>
                <td className="border px-2">{chains[chain].priorityFee.toFixed(2)}</td>
                <td className="border px-2">{usdPrice.toFixed(2)}</td>
                <td className="border px-2">
                  {mode === "simulation" ? calcCost(chain) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Step 9: Candlestick chart placeholder */}
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Gas Price Volatility (15-min Candlestick)</h2>
        <div className="border rounded bg-white" style={{ height: 300 }}>
          <GasChart data={ethCandles} />
        </div>
      </div>
    </div>
  );
}
