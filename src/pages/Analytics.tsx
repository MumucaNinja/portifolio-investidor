import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Portfolio performance insights</p>
        </div>
        <Card className="glass-card">
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Advanced analytics including CAGR, Sharpe Ratio, sector breakdown, and monthly returns heatmap will be available here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
