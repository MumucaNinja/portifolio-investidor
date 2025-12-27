import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PriceUpdateResult {
  prices: Record<string, number>;
  updatedAt: string;
  count: number;
}

export function usePriceUpdate() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const updatePrices = async (tickers: string[]) => {
    if (!session?.access_token) {
      toast({
        title: "Faça login novamente",
        description: "Sua sessão expirou. Entre novamente para atualizar cotações.",
        variant: "destructive",
      });
      return;
    }

    if (tickers.length === 0) {
      toast({
        title: "Nenhum ativo",
        description: "Adicione transações para atualizar cotações.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke<PriceUpdateResult>("update-prices", {
        body: { tickers },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.prices) {
        setPrices(data.prices);
        setLastUpdated(new Date(data.updatedAt));
        
        toast({
          title: "Cotações atualizadas",
          description: `${data.count} ativo(s) atualizado(s) com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Falha ao buscar cotações.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    prices,
    lastUpdated,
    isUpdating,
    updatePrices,
  };
}
