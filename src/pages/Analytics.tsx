import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssetAllocation } from "@/hooks/usePortfolioData";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/formatters";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Mock monthly dividends data
const monthlyDividends = [
  { month: "Jan", value: 245.50 },
  { month: "Fev", value: 312.00 },
  { month: "Mar", value: 189.75 },
  { month: "Abr", value: 425.30 },
  { month: "Mai", value: 367.80 },
  { month: "Jun", value: 298.45 },
  { month: "Jul", value: 512.20 },
  { month: "Ago", value: 445.60 },
  { month: "Set", value: 378.90 },
  { month: "Out", value: 289.00 },
  { month: "Nov", value: 456.75 },
  { month: "Dez", value: 534.40 },
];

const CHART_COLORS = [
  "hsl(238, 84%, 67%)",  // primary/indigo
  "hsl(160, 84%, 39%)",  // gain/green
  "hsl(43, 96%, 58%)",   // yellow
  "hsl(280, 65%, 60%)",  // purple
  "hsl(350, 80%, 72%)",  // pink
  "hsl(200, 80%, 50%)",  // blue
];

export default function Analytics() {
  const { allocation, isLoading } = useAssetAllocation();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrencyBRL(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-gain">
            {formatCurrencyBRL(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const totalDividends = monthlyDividends.reduce((sum, m) => sum + m.value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análises</h1>
          <p className="text-muted-foreground">Insights de desempenho do portfólio</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sector Allocation Pie Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Alocação por Setor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : allocation.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-muted-foreground text-sm text-center px-4">
                      Adicione transações para ver a alocação
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {allocation.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={renderCustomLegend} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Dividends Bar Chart */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dividendos Mensais</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Anual</p>
                <p className="text-lg font-bold text-gain">{formatCurrencyBRL(totalDividends)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyDividends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => `R$${formatNumberBR(value, 0)}`}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                    <Bar
                      dataKey="value"
                      fill="hsl(160, 84%, 39%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Mensal de Dividendos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrencyBRL(totalDividends / 12)}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maior Dividendo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gain">
                {formatCurrencyBRL(Math.max(...monthlyDividends.map(m => m.value)))}
              </p>
              <p className="text-xs text-muted-foreground">Dezembro</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Classes de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {allocation.length}
              </p>
              <p className="text-xs text-muted-foreground">na carteira</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
