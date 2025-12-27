import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface AssetClass {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

export function AssetClassesManager() {
  const { toast } = useToast();
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AssetClass | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#6366f1", is_active: true });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchAssetClasses(); }, []);

  const fetchAssetClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("asset_classes").select("*").order("name");
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else setAssetClasses(data || []);
    setIsLoading(false);
  };

  const openModal = (ac?: AssetClass) => {
    if (ac) {
      setEditingClass(ac);
      setFormData({ name: ac.name, description: ac.description || "", color: ac.color, is_active: ac.is_active });
    } else {
      setEditingClass(null);
      setFormData({ name: "", description: "", color: "#6366f1", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Name is required" });
      return;
    }
    setIsSaving(true);
    const payload = { name: formData.name, description: formData.description || null, color: formData.color, is_active: formData.is_active };

    if (editingClass) {
      const { error } = await supabase.from("asset_classes").update(payload).eq("id", editingClass.id);
      if (error) toast({ variant: "destructive", title: "Error", description: error.message });
      else { toast({ title: "Updated!" }); fetchAssetClasses(); setIsModalOpen(false); }
    } else {
      const { error } = await supabase.from("asset_classes").insert(payload);
      if (error) toast({ variant: "destructive", title: "Error", description: error.message });
      else { toast({ title: "Created!" }); fetchAssetClasses(); setIsModalOpen(false); }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset class?")) return;
    const { error } = await supabase.from("asset_classes").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Deleted!" }); fetchAssetClasses(); }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Asset Classes</CardTitle>
        <Button size="sm" onClick={() => openModal()}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetClasses.map((ac) => (
                <TableRow key={ac.id}>
                  <TableCell><div className="w-6 h-6 rounded-full" style={{ backgroundColor: ac.color }} /></TableCell>
                  <TableCell className="font-medium">{ac.name}</TableCell>
                  <TableCell className="text-muted-foreground">{ac.description || "-"}</TableCell>
                  <TableCell>{ac.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openModal(ac)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ac.id)}><Trash2 className="h-4 w-4 text-loss" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editingClass ? "Edit" : "Add"} Asset Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Color</Label><Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="h-10 w-20 p-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
