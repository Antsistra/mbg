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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Plus,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMenus,
  getMenuWithItems,
  getNutritionStandard,
} from "@/services/menuService";
import type { Menu, MenuWithItems, NutritionStandard } from "@/types/database";
import { TARGET_AUDIENCE_LABELS } from "@/types/database";

// Maximum menus to compare
const MAX_COMPARE = 3;

// Nutrition bar component for comparison
function CompareBar({
  label,
  values,
  menuNames,
  min,
  max,
  unit,
  colors,
}: {
  label: string;
  values: number[];
  menuNames: string[];
  min: number;
  max: number;
  unit: string;
  colors: string[];
}) {
  const maxValue = Math.max(...values, max);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          Target: {min} - {max} {unit}
        </span>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const isInRange = value >= min && value <= max;
          const isBelowMin = value < min;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate max-w-[150px]">
                  {menuNames[index]}
                </span>
                <span
                  className={
                    isInRange
                      ? "text-green-600"
                      : isBelowMin
                      ? "text-yellow-600"
                      : "text-red-600"
                  }
                >
                  {value.toFixed(1)} {unit}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors[index]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Target range indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Sesuai target</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Kurang</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Lebih</span>
        </div>
      </div>
    </div>
  );
}

// Comparison indicator
function CompareIndicator({
  value,
  baseline,
}: {
  value: number;
  baseline: number;
}) {
  const diff = value - baseline;
  const percentage = baseline > 0 ? ((diff / baseline) * 100).toFixed(1) : 0;

  if (Math.abs(diff) < 0.1) {
    return (
      <span className="flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-1" />
        Sama
      </span>
    );
  }

  if (diff > 0) {
    return (
      <span className="flex items-center text-xs text-green-600">
        <TrendingUp className="h-3 w-3 mr-1" />+{percentage}%
      </span>
    );
  }

  return (
    <span className="flex items-center text-xs text-red-600">
      <TrendingDown className="h-3 w-3 mr-1" />
      {percentage}%
    </span>
  );
}

export default function CompareMenu() {
  const { user } = useAuth();

  // State
  const [availableMenus, setAvailableMenus] = useState<Menu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [comparedMenus, setComparedMenus] = useState<MenuWithItems[]>([]);
  const [nutritionStandard, setNutritionStandard] =
    useState<NutritionStandard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  // Bar colors for different menus
  const barColors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500"];

  // Load available menus
  useEffect(() => {
    async function loadMenus() {
      if (!user) return;

      setIsLoading(true);
      try {
        const menus = await getMenus(user.id);
        setAvailableMenus(menus);
      } catch (error) {
        console.error("Failed to load menus:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, [user]);

  // Load menu details when selection changes
  useEffect(() => {
    async function loadMenuDetails() {
      if (selectedMenuIds.length === 0) {
        setComparedMenus([]);
        return;
      }

      setIsLoadingMenus(true);
      try {
        const menuPromises = selectedMenuIds.map((id) => getMenuWithItems(id));
        const menus = await Promise.all(menuPromises);
        setComparedMenus(menus);

        // Load nutrition standard based on first menu's target audience
        if (menus.length > 0) {
          const standard = await getNutritionStandard(
            menus[0].target_audience,
            "makan_siang"
          );
          setNutritionStandard(standard);
        }
      } catch (error) {
        console.error("Failed to load menu details:", error);
      } finally {
        setIsLoadingMenus(false);
      }
    }
    loadMenuDetails();
  }, [selectedMenuIds]);

  // Add menu to comparison
  const handleAddMenu = (menuId: string) => {
    if (selectedMenuIds.length >= MAX_COMPARE) return;
    if (selectedMenuIds.includes(menuId)) return;
    setSelectedMenuIds((prev) => [...prev, menuId]);
  };

  // Remove menu from comparison
  const handleRemoveMenu = (menuId: string) => {
    setSelectedMenuIds((prev) => prev.filter((id) => id !== menuId));
  };

  // Get unselected menus for dropdown
  const unselectedMenus = useMemo(() => {
    return availableMenus.filter((menu) => !selectedMenuIds.includes(menu.id));
  }, [availableMenus, selectedMenuIds]);

  // Calculate comparison summary
  const comparisonSummary = useMemo(() => {
    if (comparedMenus.length < 2) return null;

    const menuNames = comparedMenus.map((m) => m.name);
    const calories = comparedMenus.map((m) => m.total_calories || 0);
    const proteins = comparedMenus.map((m) => m.total_proteins || 0);
    const fat = comparedMenus.map((m) => m.total_fat || 0);
    const carbs = comparedMenus.map((m) => m.total_carbohydrate || 0);

    // Find best menu for each category (closest to middle of target range)
    const getBestIndex = (values: number[], min: number, max: number) => {
      const target = (min + max) / 2;
      let bestIndex = 0;
      let bestDiff = Math.abs(values[0] - target);

      values.forEach((val, idx) => {
        const diff = Math.abs(val - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = idx;
        }
      });

      return bestIndex;
    };

    return {
      menuNames,
      calories,
      proteins,
      fat,
      carbs,
      bestCalories: nutritionStandard
        ? getBestIndex(
            calories,
            nutritionStandard.min_calories,
            nutritionStandard.max_calories
          )
        : 0,
      bestProteins: nutritionStandard
        ? getBestIndex(
            proteins,
            nutritionStandard.min_proteins,
            nutritionStandard.max_proteins
          )
        : 0,
      bestFat: nutritionStandard
        ? getBestIndex(
            fat,
            nutritionStandard.min_fat,
            nutritionStandard.max_fat
          )
        : 0,
      bestCarbs: nutritionStandard
        ? getBestIndex(
            carbs,
            nutritionStandard.min_carbohydrate,
            nutritionStandard.max_carbohydrate
          )
        : 0,
    };
  }, [comparedMenus, nutritionStandard]);

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
                  <BreadcrumbLink href="/menu">Menu MBG</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bandingkan Gizi</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bandingkan Gizi Menu
            </h1>
            <p className="text-muted-foreground">
              Bandingkan kandungan gizi dari beberapa menu MBG
            </p>
          </div>

          {/* Menu Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pilih Menu untuk Dibandingkan
              </CardTitle>
              <CardDescription>
                Pilih hingga {MAX_COMPARE} menu untuk membandingkan kandungan
                gizinya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {/* Selected menus */}
                {comparedMenus.map((menu, index) => (
                  <div
                    key={menu.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${barColors[index]}`}
                    />
                    <span className="font-medium">{menu.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {TARGET_AUDIENCE_LABELS[menu.target_audience]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveMenu(menu.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add menu dropdown */}
                {selectedMenuIds.length < MAX_COMPARE &&
                  unselectedMenus.length > 0 && (
                    <Select onValueChange={handleAddMenu}>
                      <SelectTrigger className="w-[250px]">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <SelectValue placeholder="Tambah menu..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {unselectedMenus.map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            <div className="flex items-center gap-2">
                              <UtensilsCrossed className="h-4 w-4" />
                              <span>{menu.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
              </div>

              {availableMenus.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Belum ada menu yang tersedia. Silakan buat menu terlebih
                  dahulu.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {isLoadingMenus ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : comparedMenus.length >= 2 &&
            comparisonSummary &&
            nutritionStandard ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Nutrition Comparison Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Perbandingan Nutrisi</CardTitle>
                  <CardDescription>
                    Berdasarkan standar gizi{" "}
                    {TARGET_AUDIENCE_LABELS[comparedMenus[0].target_audience]} -
                    Makan Siang
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CompareBar
                    label="Kalori"
                    values={comparisonSummary.calories}
                    menuNames={comparisonSummary.menuNames}
                    min={nutritionStandard.min_calories}
                    max={nutritionStandard.max_calories}
                    unit="kkal"
                    colors={barColors}
                  />
                  <Separator />
                  <CompareBar
                    label="Protein"
                    values={comparisonSummary.proteins}
                    menuNames={comparisonSummary.menuNames}
                    min={nutritionStandard.min_proteins}
                    max={nutritionStandard.max_proteins}
                    unit="g"
                    colors={barColors}
                  />
                  <Separator />
                  <CompareBar
                    label="Lemak"
                    values={comparisonSummary.fat}
                    menuNames={comparisonSummary.menuNames}
                    min={nutritionStandard.min_fat}
                    max={nutritionStandard.max_fat}
                    unit="g"
                    colors={barColors}
                  />
                  <Separator />
                  <CompareBar
                    label="Karbohidrat"
                    values={comparisonSummary.carbs}
                    menuNames={comparisonSummary.menuNames}
                    min={nutritionStandard.min_carbohydrate}
                    max={nutritionStandard.max_carbohydrate}
                    unit="g"
                    colors={barColors}
                  />
                </CardContent>
              </Card>

              {/* Summary Cards for each menu */}
              {comparedMenus.map((menu, index) => (
                <Card key={menu.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${barColors[index]}`}
                      />
                      <CardTitle className="text-lg">{menu.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {menu.items.length} bahan pangan • {menu.serving_size}{" "}
                      porsi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Kalori</p>
                        <p className="text-xl font-semibold">
                          {(menu.total_calories || 0).toFixed(0)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            kkal
                          </span>
                        </p>
                        {index > 0 && (
                          <CompareIndicator
                            value={menu.total_calories || 0}
                            baseline={comparedMenus[0].total_calories || 0}
                          />
                        )}
                        {comparisonSummary.bestCalories === index && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Terbaik
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Protein</p>
                        <p className="text-xl font-semibold">
                          {(menu.total_proteins || 0).toFixed(1)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            g
                          </span>
                        </p>
                        {index > 0 && (
                          <CompareIndicator
                            value={menu.total_proteins || 0}
                            baseline={comparedMenus[0].total_proteins || 0}
                          />
                        )}
                        {comparisonSummary.bestProteins === index && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Terbaik
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Lemak</p>
                        <p className="text-xl font-semibold">
                          {(menu.total_fat || 0).toFixed(1)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            g
                          </span>
                        </p>
                        {index > 0 && (
                          <CompareIndicator
                            value={menu.total_fat || 0}
                            baseline={comparedMenus[0].total_fat || 0}
                          />
                        )}
                        {comparisonSummary.bestFat === index && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Terbaik
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Karbohidrat
                        </p>
                        <p className="text-xl font-semibold">
                          {(menu.total_carbohydrate || 0).toFixed(1)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            g
                          </span>
                        </p>
                        {index > 0 && (
                          <CompareIndicator
                            value={menu.total_carbohydrate || 0}
                            baseline={comparedMenus[0].total_carbohydrate || 0}
                          />
                        )}
                        {comparisonSummary.bestCarbs === index && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Terbaik
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Food items list */}
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-2">Bahan Pangan:</p>
                      <div className="flex flex-wrap gap-1">
                        {menu.items.slice(0, 5).map((item) => (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {item.food_item.name}
                          </Badge>
                        ))}
                        {menu.items.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{menu.items.length - 5} lainnya
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comparedMenus.length === 1 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Pilih minimal 2 menu</p>
                <p className="text-muted-foreground">
                  Tambahkan satu menu lagi untuk memulai perbandingan
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">
                  Belum ada menu yang dipilih
                </p>
                <p className="text-muted-foreground">
                  Pilih menu dari dropdown di atas untuk memulai perbandingan
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
