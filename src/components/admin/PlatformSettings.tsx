import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export function PlatformSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("platform_settings").select("*");
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else setSettings(data || []);
    setIsLoading(false);
  };

  const toggleSetting = async (setting: Setting) => {
    setUpdating(setting.id);
    const newValue = setting.value === "true" ? "false" : "true";
    const { error } = await supabase.from("platform_settings").update({ value: newValue }).eq("id", setting.id);
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: "Configuração atualizada" }); fetchSettings(); }
    setUpdating(null);
  };

  const getSettingLabel = (key: string) => {
    switch (key) {
      case "maintenance_mode": return "Modo Manutenção";
      case "allow_signups": return "Permitir Cadastros";
      default: return key;
    }
  };

  const getSettingDescription = (key: string) => {
    switch (key) {
      case "maintenance_mode": return "Quando ativado, apenas admins podem acessar a plataforma";
      case "allow_signups": return "Permitir que novos usuários se cadastrem na plataforma";
      default: return "";
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Configurações da Plataforma</CardTitle>
        <CardDescription>Configure o comportamento global da plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <div className="space-y-6">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{getSettingLabel(s.key)}</Label>
                  <p className="text-sm text-muted-foreground">{getSettingDescription(s.key)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {updating === s.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch checked={s.value === "true"} onCheckedChange={() => toggleSetting(s)} disabled={updating === s.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
