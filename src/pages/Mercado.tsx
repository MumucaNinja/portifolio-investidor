import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    TradingView: any;
  }
}

function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BMFBOVESPA:IBOV", title: "IBOVESPA" },
        { proName: "FX_IDC:USDBRL", title: "USD/BRL" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
      ],
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "adaptive",
      locale: "br",
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

function AdvancedChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BMFBOVESPA:IBOV",
      interval: "D",
      timezone: "America/Sao_Paulo",
      theme: "dark",
      style: "1",
      locale: "br",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  );
}

function MarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "br",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "100%",
      tabs: [
        {
          title: "Ações BR",
          symbols: [
            { s: "BMFBOVESPA:PETR4", d: "Petrobras PN" },
            { s: "BMFBOVESPA:VALE3", d: "Vale ON" },
            { s: "BMFBOVESPA:ITUB4", d: "Itaú PN" },
            { s: "BMFBOVESPA:BBDC4", d: "Bradesco PN" },
            { s: "BMFBOVESPA:ABEV3", d: "Ambev ON" },
          ],
          originalTitle: "Stocks",
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
            { s: "BITSTAMP:ETHUSD", d: "Ethereum" },
            { s: "BINANCE:SOLUSDT", d: "Solana" },
            { s: "BINANCE:ADAUSDT", d: "Cardano" },
          ],
          originalTitle: "Crypto",
        },
        {
          title: "Índices",
          symbols: [
            { s: "BMFBOVESPA:IBOV", d: "IBOVESPA" },
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
            { s: "TVC:DJI", d: "Dow Jones" },
          ],
          originalTitle: "Indices",
        },
      ],
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  );
}

export default function Mercado() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mercado</h1>
          <p className="text-muted-foreground">Visão geral do mercado financeiro</p>
        </div>

        {/* Ticker Tape at the top */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <TickerTape />
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Advanced Chart - takes 2 columns */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Gráfico</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <AdvancedChart />
            </CardContent>
          </Card>

          {/* Market Overview - right side */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Visão do Mercado</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <MarketOverview />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
