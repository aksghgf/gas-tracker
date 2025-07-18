import { create } from 'zustand';

export const useGasStore = create((set) => ({
  mode: 'live',
  chains: {
    ethereum: { baseFee: 0, priorityFee: 0, history: [] },
    polygon: { baseFee: 0, priorityFee: 0, history: [] },
    arbitrum: { baseFee: 0, priorityFee: 0, history: [] },
  },
  usdPrice: 0,
  setMode: (mode) => set({ mode }),
  setChainData: (chain, data) =>
    set((state) => {
      const prev = state.chains[chain];
      // Add new history entry if baseFee is present
      let history = prev.history || [];
      if (typeof data.baseFee === 'number') {
        history = [
          ...history,
          { baseFee: data.baseFee, priorityFee: data.priorityFee, timestamp: Date.now() }
        ];
        if (history.length > 1000) history = history.slice(history.length - 1000);
      }
      return {
        chains: {
          ...state.chains,
          [chain]: { ...prev, ...data, history },
        },
      };
    }),
  setUsdPrice: (usdPrice) => set({ usdPrice }),
}));