import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  ticker: string;
  asset_name: string;
  asset_class_id: string;
  transaction_type: string;
  transaction_date: string;
  quantity: number;
  price_per_unit: number;
  fees: number;
  total_value: number;
  created_at: string;
  asset_classes: {
    name: string;
    color: string;
  } | null;
}

interface Holding {
  ticker: string;
  asset_name: string;
  asset_class: string;
  asset_class_color: string;
  quantity: number;
  avg_price: number;
  total_cost: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

interface AssetAllocation {
  name: string;
  value: number;
  color: string;
}

// Mock current prices (in real app, would fetch from API)
const mockPrices: Record<string, number> = {
  AAPL: 178.50,
  NVDA: 875.20,
  MSFT: 378.90,
  GOOGL: 142.65,
  VOO: 445.30,
  QQQ: 408.75,
  VTI: 238.40,
  BTC: 43500.00,
  ETH: 2280.00,
  VNQ: 82.15,
};

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          asset_classes (
            name,
            color
          )
        `)
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useHoldings() {
  const { data: transactions, isLoading } = useTransactions();

  const holdings: Holding[] = [];

  if (transactions) {
    const holdingsMap = new Map<string, {
      ticker: string;
      asset_name: string;
      asset_class: string;
      asset_class_color: string;
      total_quantity: number;
      total_cost: number;
    }>();

    for (const tx of transactions) {
      const existing = holdingsMap.get(tx.ticker) || {
        ticker: tx.ticker,
        asset_name: tx.asset_name,
        asset_class: tx.asset_classes?.name || "Unknown",
        asset_class_color: tx.asset_classes?.color || "#6b7280",
        total_quantity: 0,
        total_cost: 0,
      };

      if (tx.transaction_type === "buy") {
        existing.total_quantity += tx.quantity;
        existing.total_cost += tx.total_value;
      } else {
        existing.total_quantity -= tx.quantity;
        existing.total_cost -= tx.quantity * (existing.total_cost / (existing.total_quantity + tx.quantity));
      }

      holdingsMap.set(tx.ticker, existing);
    }

    for (const [_, h] of holdingsMap) {
      if (h.total_quantity > 0) {
        const currentPrice = mockPrices[h.ticker] || h.total_cost / h.total_quantity;
        const currentValue = h.total_quantity * currentPrice;
        const profitLoss = currentValue - h.total_cost;
        const profitLossPercent = h.total_cost > 0 ? (profitLoss / h.total_cost) * 100 : 0;

        holdings.push({
          ticker: h.ticker,
          asset_name: h.asset_name,
          asset_class: h.asset_class,
          asset_class_color: h.asset_class_color,
          quantity: h.total_quantity,
          avg_price: h.total_cost / h.total_quantity,
          total_cost: h.total_cost,
          current_price: currentPrice,
          current_value: currentValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
        });
      }
    }
  }

  return { holdings, isLoading };
}

export function usePortfolioSummary() {
  const { holdings, isLoading } = useHoldings();

  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.total_cost, 0);
  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  // Day's gain would require historical price data - showing 0 for now
  const dayGain = 0;
  const dayGainPercent = 0;

  // Cash balance would require a separate cash transactions table - showing 0 for now
  const cashBalance = 0;

  return {
    totalValue,
    totalCost,
    totalReturn,
    totalReturnPercent,
    dayGain,
    dayGainPercent,
    cashBalance,
    isLoading,
  };
}

export function useAssetAllocation() {
  const { holdings, isLoading } = useHoldings();

  const allocationMap = new Map<string, { value: number; color: string }>();

  for (const h of holdings) {
    const existing = allocationMap.get(h.asset_class) || { value: 0, color: h.asset_class_color };
    existing.value += h.current_value;
    allocationMap.set(h.asset_class, existing);
  }

  const allocation: AssetAllocation[] = [];
  for (const [name, data] of allocationMap) {
    allocation.push({ name, value: data.value, color: data.color });
  }

  return { allocation, isLoading };
}
