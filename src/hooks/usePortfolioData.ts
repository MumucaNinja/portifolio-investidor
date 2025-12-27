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

// Prices are now fetched from Brapi.dev API via usePriceUpdate hook
// Empty fallback - real prices come from the API
const fallbackPrices: Record<string, number> = {};

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

export function useHoldings(externalPrices?: Record<string, number>) {
  const { data: transactions, isLoading } = useTransactions();

  const holdings: Holding[] = [];
  const tickers: string[] = [];

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
        tickers.push(h.ticker);
        // Use external prices if available, otherwise use average cost
        const currentPrice = externalPrices?.[h.ticker] || h.total_cost / h.total_quantity;
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

  return { holdings, tickers, isLoading };
}

export function usePortfolioSummary(externalPrices?: Record<string, number>) {
  const { holdings, tickers, isLoading } = useHoldings(externalPrices);

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
    tickers,
    isLoading,
  };
}

export function useAssetAllocation(externalPrices?: Record<string, number>) {
  const { holdings, isLoading } = useHoldings(externalPrices);

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

interface MonthlyDividend {
  month: string;
  value: number;
  fullDate: string;
}

export function useDividends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dividends", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("transaction_type", "dividend")
        .order("transaction_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useMonthlyDividends() {
  const { data: dividends, isLoading } = useDividends();

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Initialize all months with zero
  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    monthlyMap.set(`${currentYear}-${String(i + 1).padStart(2, '0')}`, 0);
  }

  // Sum dividends by month
  if (dividends) {
    for (const tx of dividends) {
      const date = new Date(tx.transaction_date);
      const year = date.getFullYear();
      
      // Only include current year dividends
      if (year === currentYear) {
        const key = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyMap.get(key) || 0;
        monthlyMap.set(key, existing + tx.total_value);
      }
    }
  }

  // Convert to array format for chart
  const monthlyDividends: MonthlyDividend[] = [];
  for (const [key, value] of monthlyMap) {
    const [year, month] = key.split('-');
    const monthIndex = parseInt(month) - 1;
    monthlyDividends.push({
      month: monthNames[monthIndex],
      value,
      fullDate: key,
    });
  }

  // Calculate stats
  const totalDividends = monthlyDividends.reduce((sum, m) => sum + m.value, 0);
  const maxDividend = Math.max(...monthlyDividends.map(m => m.value), 0);
  const maxDividendMonth = monthlyDividends.find(m => m.value === maxDividend && maxDividend > 0);
  const monthsWithData = monthlyDividends.filter(m => m.value > 0).length;
  const avgMonthly = monthsWithData > 0 ? totalDividends / monthsWithData : 0;

  return {
    monthlyDividends,
    totalDividends,
    maxDividend,
    maxDividendMonth: maxDividendMonth?.month || null,
    avgMonthly,
    isLoading,
    hasDividends: totalDividends > 0,
  };
}
