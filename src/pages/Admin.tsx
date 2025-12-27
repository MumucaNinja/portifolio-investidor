import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">System management</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card-hover"><CardHeader><CardTitle>Asset Classes</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage asset categories</p></CardContent></Card>
          <Card className="glass-card-hover"><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage users</p></CardContent></Card>
          <Card className="glass-card-hover"><CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">System configuration</p></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
