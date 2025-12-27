import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ban, Trash2, UserCheck } from "lucide-react";
import { formatDateBR } from "@/lib/formatters";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_banned: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export function UserManagement() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    
    if (profilesRes.error) toast({ variant: "destructive", title: "Erro", description: profilesRes.error.message });
    else setProfiles(profilesRes.data || []);

    if (rolesRes.data) {
      const roleMap: Record<string, string> = {};
      rolesRes.data.forEach((r: UserRole) => { roleMap[r.user_id] = r.role; });
      setRoles(roleMap);
    }
    setIsLoading(false);
  };

  const toggleBan = async (profile: Profile) => {
    const newBanned = !profile.is_banned;
    const { error } = await supabase.from("profiles").update({ is_banned: newBanned }).eq("id", profile.id);
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: newBanned ? "Usuário banido" : "Usuário desbanido" }); fetchUsers(); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Isso removerá o perfil e as permissões do usuário. Tem certeza?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: "Usuário excluído" }); fetchUsers(); }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!confirm("Promover este usuário para admin?")) return;
    const { error } = await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", userId);
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: "Usuário promovido a admin" }); fetchUsers(); }
  };

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Gerenciamento de Usuários</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : profiles.length === 0 ? (
          <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roles[p.id] === "admin" ? "default" : "secondary"}>
                      {roles[p.id] === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_banned ? "destructive" : "outline"}>
                      {p.is_banned ? "Banido" : "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateBR(p.created_at)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {roles[p.id] !== "admin" && (
                      <Button variant="ghost" size="icon" onClick={() => promoteToAdmin(p.id)} title="Promover a Admin">
                        <UserCheck className="h-4 w-4 text-gain" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => toggleBan(p)} title={p.is_banned ? "Desbanir" : "Banir"}>
                      <Ban className={`h-4 w-4 ${p.is_banned ? "text-gain" : "text-loss"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteUser(p.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-loss" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
