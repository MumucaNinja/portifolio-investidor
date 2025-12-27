import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetClassesManager } from "@/components/admin/AssetClassesManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { PlatformSettings } from "@/components/admin/PlatformSettings";
import { Loader2, Package, Users, Settings } from "lucide-react";

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage assets, users, and platform settings</p>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="assets" className="gap-2">
              <Package className="h-4 w-4" />
              Asset Classes
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <AssetClassesManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
