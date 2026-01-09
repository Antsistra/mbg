import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Save, Settings2 } from "lucide-react";

import {
  getAllNutritionStandards,
  updateNutritionStandard,
  createNutritionStandard,
} from "@/services/menuService";
import type { NutritionStandard, TargetAudience } from "@/types/database";
import { TARGET_AUDIENCE_LABELS } from "@/types/database";

type EditFormData = {
  min_calories: number;
  max_calories: number;
  min_proteins: number;
  max_proteins: number;
  min_fat: number;
  max_fat: number;
  min_carbohydrate: number;
  max_carbohydrate: number;
  description: string;
};

const defaultFormData: EditFormData = {
  min_calories: 0,
  max_calories: 0,
  min_proteins: 0,
  max_proteins: 0,
  min_fat: 0,
  max_fat: 0,
  min_carbohydrate: 0,
  max_carbohydrate: 0,
  description: "",
};

export default function StandarGizi() {
  const [standards, setStandards] = useState<NutritionStandard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [filterAudience, setFilterAudience] = useState<TargetAudience | "all">(
    "all"
  );

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStandard, setEditingStandard] =
    useState<NutritionStandard | null>(null);
  const [formData, setFormData] = useState<EditFormData>(defaultFormData);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTargetAudience, setNewTargetAudience] =
    useState<TargetAudience>("sd");
  const [createFormData, setCreateFormData] =
    useState<EditFormData>(defaultFormData);

  // Load standards
  const loadStandards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllNutritionStandards();
      setStandards(data);
    } catch (error) {
      console.error("Failed to load nutrition standards:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStandards();
  }, [loadStandards]);

  // Filter standards - only show makan_siang
  const filteredStandards = standards.filter((s) => {
    if (s.meal_type !== "makan_siang") return false;
    if (filterAudience !== "all" && s.target_audience !== filterAudience)
      return false;
    return true;
  });

  // Open edit dialog
  const handleEdit = (standard: NutritionStandard) => {
    setEditingStandard(standard);
    setFormData({
      min_calories: standard.min_calories,
      max_calories: standard.max_calories,
      min_proteins: standard.min_proteins,
      max_proteins: standard.max_proteins,
      min_fat: standard.min_fat,
      max_fat: standard.max_fat,
      min_carbohydrate: standard.min_carbohydrate,
      max_carbohydrate: standard.max_carbohydrate,
      description: standard.description || "",
    });
    setEditDialogOpen(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingStandard) return;

    setIsSaving(true);
    try {
      await updateNutritionStandard(editingStandard.id, {
        min_calories: formData.min_calories,
        max_calories: formData.max_calories,
        min_proteins: formData.min_proteins,
        max_proteins: formData.max_proteins,
        min_fat: formData.min_fat,
        max_fat: formData.max_fat,
        min_carbohydrate: formData.min_carbohydrate,
        max_carbohydrate: formData.max_carbohydrate,
        description: formData.description || undefined,
      });
      await loadStandards();
      setEditDialogOpen(false);
      setEditingStandard(null);
    } catch (error) {
      console.error("Failed to update standard:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new standard
  const handleCreate = async () => {
    // Check if combination already exists (always makan_siang)
    const exists = standards.some(
      (s) =>
        s.target_audience === newTargetAudience && s.meal_type === "makan_siang"
    );

    if (exists) {
      alert(
        "Standar gizi untuk kombinasi ini sudah ada. Silakan edit standar yang sudah ada."
      );
      return;
    }

    setIsSaving(true);
    try {
      await createNutritionStandard({
        target_audience: newTargetAudience,
        meal_type: "makan_siang",
        min_calories: createFormData.min_calories,
        max_calories: createFormData.max_calories,
        min_proteins: createFormData.min_proteins,
        max_proteins: createFormData.max_proteins,
        min_fat: createFormData.min_fat,
        max_fat: createFormData.max_fat,
        min_carbohydrate: createFormData.min_carbohydrate,
        max_carbohydrate: createFormData.max_carbohydrate,
        description: createFormData.description || undefined,
      });
      await loadStandards();
      setCreateDialogOpen(false);
      setCreateFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to create standard:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Form input handler
  const handleInputChange = (
    field: keyof EditFormData,
    value: string,
    isCreate = false
  ) => {
    const numValue = field === "description" ? value : parseFloat(value) || 0;
    if (isCreate) {
      setCreateFormData((prev) => ({ ...prev, [field]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Pengaturan</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Standar Gizi</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Standar Gizi
              </h1>
              <p className="text-muted-foreground">
                Atur nilai minimum dan maksimum nutrisi untuk setiap target
                sasaran dan waktu makan
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Standar
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="w-48">
                  <Label className="text-sm mb-1.5 block">Target Sasaran</Label>
                  <Select
                    value={filterAudience}
                    onValueChange={(v) =>
                      setFilterAudience(v as TargetAudience | "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {Object.entries(TARGET_AUDIENCE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Standards Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Standar Gizi</CardTitle>
              <CardDescription>
                {filteredStandards.length} standar ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target Sasaran</TableHead>
                      <TableHead className="text-center">
                        Kalori (kkal)
                      </TableHead>
                      <TableHead className="text-center">Protein (g)</TableHead>
                      <TableHead className="text-center">Lemak (g)</TableHead>
                      <TableHead className="text-center">
                        Karbohidrat (g)
                      </TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStandards.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Tidak ada standar gizi yang ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStandards.map((standard) => (
                        <TableRow key={standard.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {TARGET_AUDIENCE_LABELS[standard.target_audience]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {standard.min_calories} - {standard.max_calories}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {standard.min_proteins} - {standard.max_proteins}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {standard.min_fat} - {standard.max_fat}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm">
                              {standard.min_carbohydrate} -{" "}
                              {standard.max_carbohydrate}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(standard)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Standar Gizi</DialogTitle>
              <DialogDescription>
                {editingStandard && (
                  <>
                    {TARGET_AUDIENCE_LABELS[editingStandard.target_audience]} -
                    Makan Siang
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Calories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Kalori (kkal)</Label>
                  <Input
                    type="number"
                    value={formData.min_calories}
                    onChange={(e) =>
                      handleInputChange("min_calories", e.target.value)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Kalori (kkal)</Label>
                  <Input
                    type="number"
                    value={formData.max_calories}
                    onChange={(e) =>
                      handleInputChange("max_calories", e.target.value)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Proteins */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Protein (g)</Label>
                  <Input
                    type="number"
                    value={formData.min_proteins}
                    onChange={(e) =>
                      handleInputChange("min_proteins", e.target.value)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Protein (g)</Label>
                  <Input
                    type="number"
                    value={formData.max_proteins}
                    onChange={(e) =>
                      handleInputChange("max_proteins", e.target.value)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Lemak (g)</Label>
                  <Input
                    type="number"
                    value={formData.min_fat}
                    onChange={(e) =>
                      handleInputChange("min_fat", e.target.value)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Lemak (g)</Label>
                  <Input
                    type="number"
                    value={formData.max_fat}
                    onChange={(e) =>
                      handleInputChange("max_fat", e.target.value)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Carbohydrate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Karbohidrat (g)</Label>
                  <Input
                    type="number"
                    value={formData.min_carbohydrate}
                    onChange={(e) =>
                      handleInputChange("min_carbohydrate", e.target.value)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Karbohidrat (g)</Label>
                  <Input
                    type="number"
                    value={formData.max_carbohydrate}
                    onChange={(e) =>
                      handleInputChange("max_carbohydrate", e.target.value)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Deskripsi standar gizi (opsional)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Standar Gizi Baru</DialogTitle>
              <DialogDescription>
                Buat standar gizi baru untuk target sasaran
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Target Sasaran */}
              <div className="space-y-2">
                <Label>Target Sasaran</Label>
                <Select
                  value={newTargetAudience}
                  onValueChange={(v) =>
                    setNewTargetAudience(v as TargetAudience)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TARGET_AUDIENCE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Calories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Kalori (kkal)</Label>
                  <Input
                    type="number"
                    value={createFormData.min_calories}
                    onChange={(e) =>
                      handleInputChange("min_calories", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Kalori (kkal)</Label>
                  <Input
                    type="number"
                    value={createFormData.max_calories}
                    onChange={(e) =>
                      handleInputChange("max_calories", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Proteins */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Protein (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.min_proteins}
                    onChange={(e) =>
                      handleInputChange("min_proteins", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Protein (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.max_proteins}
                    onChange={(e) =>
                      handleInputChange("max_proteins", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Lemak (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.min_fat}
                    onChange={(e) =>
                      handleInputChange("min_fat", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Lemak (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.max_fat}
                    onChange={(e) =>
                      handleInputChange("max_fat", e.target.value, true)
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Carbohydrate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Karbohidrat (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.min_carbohydrate}
                    onChange={(e) =>
                      handleInputChange(
                        "min_carbohydrate",
                        e.target.value,
                        true
                      )
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Karbohidrat (g)</Label>
                  <Input
                    type="number"
                    value={createFormData.max_carbohydrate}
                    onChange={(e) =>
                      handleInputChange(
                        "max_carbohydrate",
                        e.target.value,
                        true
                      )
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={createFormData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value, true)
                  }
                  placeholder="Deskripsi standar gizi (opsional)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
