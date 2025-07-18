"use client";
import { useEffect, useRef, useState } from "react";

function isValidCandle(candle) {
  return (
    candle &&
    typeof candle.time === "number" &&
    typeof candle.open === "number" &&
    typeof candle.high === "number" &&
    typeof candle.low === "number" &&
    typeof candle.close === "number" &&
    !isNaN(candle.time) &&
    !isNaN(candle.open) &&
    !isNaN(candle.high) &&
    !isNaN(candle.low) &&
    !isNaN(candle.close)
  );
}

export default function GasChart({ data }) {
  const chartRef = useRef();
  const chartInstance = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let chart;
    let candleSeries;
    let isMounted = true;

    async function loadChart() {
      if (!chartRef.current) return;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
      try {
        const chartsModule = await import("lightweight-charts");
        const { createChart } = chartsModule;
        chart = createChart(chartRef.current, {
          width: chartRef.current.offsetWidth || 600,
          height: chartRef.current.offsetHeight || 300,
          layout: { background: { type: 'solid', color: '#fff' } },
        });
        if (typeof chart.addSeries !== "function") {
          setError("addSeries not supported by lightweight-charts. Check your library version.");
          return;
        }
        candleSeries = chart.addSeries({ type: "Candlestick" });
        console.log("Raw data:", data);
        const validData = Array.isArray(data) ? data.filter(isValidCandle) : [];
        console.log("Candlestick data:", validData);
        if (validData.length === 0) {
          setError("No valid candlestick data to display.");
          return;
        }
        try {
          candleSeries.setData(validData);
        } catch (e) {
          setError("Assertion failed in lightweight-charts: " + e.message);
          return;
        }
        chartInstance.current = chart;
        setError(null);
      } catch (e) {
        setError("Failed to render chart: " + e.message);
      }
    }

    loadChart();

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
    };
  }, [data]);

  return (
    <div style={{ width: "100%", height: 300 }} ref={chartRef}>
      {error && (
        <div className="text-red-500 p-2">{error}</div>
      )}
    </div>
  );
} 