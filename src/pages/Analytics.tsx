import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análises</h1>
          <p className="text-muted-foreground">Insights de desempenho do portfólio</p>
        </div>
        <Card className="glass-card">
          <CardHeader><CardTitle>Em Breve</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Análises avançadas incluindo CAGR, Índice Sharpe, breakdown por setor e mapa de calor de retornos mensais estarão disponíveis aqui.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
