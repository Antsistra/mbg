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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Apple,
  Plus,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  BarChart3,
  Scale,
  Flame,
  Beef,
  Droplets,
  Wheat,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getFoodItems, searchFoodItems } from "@/services/menuService";
import type { FoodItem } from "@/types/database";

// Maximum items to compare
const MAX_COMPARE = 4;

// Nutrition bar component for comparison
function CompareBar({
  label,
  values,
  itemNames,
  unit,
  colors,
  icon: Icon,
}: {
  label: string;
  values: number[];
  itemNames: string[];
  unit: string;
  colors: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Rata-rata: {avgValue.toFixed(1)} {unit}
        </span>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const isHighest =
            value === maxValue &&
            values.filter((v) => v === maxValue).length === 1;
          const isLowest =
            value === minValue &&
            values.filter((v) => v === minValue).length === 1;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate max-w-[200px]">
                  {itemNames[index]}
                </span>
                <div className="flex items-center gap-2">
                  {isHighest && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-green-600 border-green-200"
                    >
                      Tertinggi
                    </Badge>
                  )}
                  {isLowest && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-yellow-600 border-yellow-200"
                    >
                      Terendah
                    </Badge>
                  )}
                  <span className="font-medium">
                    {value.toFixed(1)} {unit}
                  </span>
                </div>
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
  const percentage = baseline > 0 ? ((diff / baseline) * 100).toFixed(1) : "0";

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

// Food item card for comparison
function FoodCompareCard({
  item,
  index,
  color,
  baseline,
  onRemove,
}: {
  item: FoodItem;
  index: number;
  color: string;
  baseline: FoodItem | null;
  onRemove: () => void;
}) {
  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 z-10"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <CardTitle className="text-sm truncate pr-6">{item.name}</CardTitle>
        </div>
        <Badge
          variant={item.cluster === "cluster_0" ? "default" : "secondary"}
          className="w-fit"
        >
          {item.cluster === "cluster_0" ? "Aman" : "Tidak Aman"}
        </Badge>
      </CardHeader>
      <CardContent>
        {item.image && (
          <div className="mb-3 rounded-lg overflow-hidden h-24">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" /> Kalori
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.calories} kkal</span>
              {baseline && index > 0 && (
                <CompareIndicator
                  value={item.calories}
                  baseline={baseline.calories}
                />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Beef className="h-3 w-3" /> Protein
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.proteins} g</span>
              {baseline && index > 0 && (
                <CompareIndicator
                  value={item.proteins}
                  baseline={baseline.proteins}
                />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Lemak
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.fat} g</span>
              {baseline && index > 0 && (
                <CompareIndicator value={item.fat} baseline={baseline.fat} />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wheat className="h-3 w-3" /> Karbohidrat
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.carbohydrate} g</span>
              {baseline && index > 0 && (
                <CompareIndicator
                  value={item.carbohydrate}
                  baseline={baseline.carbohydrate}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CompareFoodItems() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);

  // Bar colors for different items
  const barColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
  ];

  // Load initial food items
  useEffect(() => {
    async function loadFoodItems() {
      setIsLoading(true);
      try {
        const items = await getFoodItems({ limit: 50 });
        setAllFoodItems(items);
        setSearchResults(items.slice(0, 10));
      } catch (error) {
        console.error("Failed to load food items:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFoodItems();
  }, []);

  // Search food items
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchFoodItems(searchQuery, 20);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to search food items:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(allFoodItems.slice(0, 10));
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allFoodItems]);

  // Add item to comparison
  const handleAddItem = (item: FoodItem) => {
    if (selectedItems.length >= MAX_COMPARE) return;
    if (selectedItems.find((i) => i.id === item.id)) return;
    setSelectedItems((prev) => [...prev, item]);
  };

  // Remove item from comparison
  const handleRemoveItem = (itemId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Get items not selected for dropdown
  const availableItems = useMemo(() => {
    return searchResults.filter(
      (item) => !selectedItems.find((i) => i.id === item.id)
    );
  }, [searchResults, selectedItems]);

  // Calculate comparison summary
  const comparisonSummary = useMemo(() => {
    if (selectedItems.length < 2) return null;

    const itemNames = selectedItems.map((i) => i.name);
    const calories = selectedItems.map((i) => i.calories);
    const proteins = selectedItems.map((i) => i.proteins);
    const fat = selectedItems.map((i) => i.fat);
    const carbs = selectedItems.map((i) => i.carbohydrate);

    // Find best item for each category
    const getBestIndex = (values: number[], findMax: boolean = true) => {
      if (findMax) {
        return values.indexOf(Math.max(...values));
      }
      return values.indexOf(Math.min(...values));
    };

    return {
      itemNames,
      calories,
      proteins,
      fat,
      carbs,
      highestCalories: getBestIndex(calories, true),
      lowestCalories: getBestIndex(calories, false),
      highestProteins: getBestIndex(proteins, true),
      highestFat: getBestIndex(fat, true),
      lowestFat: getBestIndex(fat, false),
      highestCarbs: getBestIndex(carbs, true),
    };
  }, [selectedItems]);

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
                  <BreadcrumbLink href="/bahan-pangan">
                    Bahan Pangan
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bandingkan</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bandingkan Bahan Pangan
            </h1>
            <p className="text-muted-foreground">
              Bandingkan kandungan gizi dari berbagai bahan pangan
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left Panel - Search and Select */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Pilih Bahan Pangan
                </CardTitle>
                <CardDescription>
                  Pilih hingga {MAX_COMPARE} bahan untuk dibandingkan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari bahan pangan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Dipilih ({selectedItems.length}/{MAX_COMPARE})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((item, index) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="flex items-center gap-1 pl-1"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${barColors[index]}`}
                          />
                          <span className="max-w-[100px] truncate">
                            {item.name}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                <ScrollArea className="h-[300px]">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : availableItems.length > 0 ? (
                    <div className="space-y-1">
                      {availableItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          disabled={selectedItems.length >= MAX_COMPARE}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-md object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <Apple className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.calories} kkal • {item.proteins}g protein
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {searchQuery
                        ? "Tidak ada hasil ditemukan"
                        : "Tidak ada bahan pangan tersedia"}
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Panel - Comparison Results */}
            <div className="lg:col-span-2 space-y-4">
              {selectedItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Scale className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      Pilih Bahan Pangan untuk Dibandingkan
                    </h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">
                      Cari dan pilih minimal 2 bahan pangan dari panel kiri
                      untuk melihat perbandingan kandungan gizinya
                    </p>
                  </CardContent>
                </Card>
              ) : selectedItems.length === 1 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      Tambah Bahan Pangan Lainnya
                    </h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">
                      Pilih minimal 1 bahan pangan lagi untuk memulai
                      perbandingan
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Comparison Cards */}
                  <div
                    className={`grid gap-4 ${
                      selectedItems.length <= 2
                        ? "grid-cols-2"
                        : selectedItems.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 lg:grid-cols-4"
                    }`}
                  >
                    {selectedItems.map((item, index) => (
                      <FoodCompareCard
                        key={item.id}
                        item={item}
                        index={index}
                        color={barColors[index]}
                        baseline={index > 0 ? selectedItems[0] : null}
                        onRemove={() => handleRemoveItem(item.id)}
                      />
                    ))}
                  </div>

                  {/* Nutrition Comparison Chart */}
                  {comparisonSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Perbandingan Nutrisi
                        </CardTitle>
                        <CardDescription>
                          Perbandingan visual kandungan gizi per 100g bahan
                          pangan
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <CompareBar
                          label="Kalori"
                          values={comparisonSummary.calories}
                          itemNames={comparisonSummary.itemNames}
                          unit="kkal"
                          colors={barColors}
                          icon={Flame}
                        />
                        <Separator />
                        <CompareBar
                          label="Protein"
                          values={comparisonSummary.proteins}
                          itemNames={comparisonSummary.itemNames}
                          unit="g"
                          colors={barColors}
                          icon={Beef}
                        />
                        <Separator />
                        <CompareBar
                          label="Lemak"
                          values={comparisonSummary.fat}
                          itemNames={comparisonSummary.itemNames}
                          unit="g"
                          colors={barColors}
                          icon={Droplets}
                        />
                        <Separator />
                        <CompareBar
                          label="Karbohidrat"
                          values={comparisonSummary.carbs}
                          itemNames={comparisonSummary.itemNames}
                          unit="g"
                          colors={barColors}
                          icon={Wheat}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Summary Insights */}
                  {comparisonSummary && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Ringkasan Perbandingan</CardTitle>
                        <CardDescription>
                          Insight dari perbandingan {selectedItems.length} bahan
                          pangan
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="p-2 rounded-full bg-orange-100">
                              <Flame className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Kalori Tertinggi
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {
                                  comparisonSummary.itemNames[
                                    comparisonSummary.highestCalories
                                  ]
                                }{" "}
                                (
                                {
                                  comparisonSummary.calories[
                                    comparisonSummary.highestCalories
                                  ]
                                }{" "}
                                kkal)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="p-2 rounded-full bg-red-100">
                              <Beef className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Protein Tertinggi
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {
                                  comparisonSummary.itemNames[
                                    comparisonSummary.highestProteins
                                  ]
                                }{" "}
                                (
                                {
                                  comparisonSummary.proteins[
                                    comparisonSummary.highestProteins
                                  ]
                                }{" "}
                                g)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="p-2 rounded-full bg-yellow-100">
                              <Droplets className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Lemak Terendah
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {
                                  comparisonSummary.itemNames[
                                    comparisonSummary.lowestFat
                                  ]
                                }{" "}
                                (
                                {
                                  comparisonSummary.fat[
                                    comparisonSummary.lowestFat
                                  ]
                                }{" "}
                                g)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="p-2 rounded-full bg-amber-100">
                              <Wheat className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Karbohidrat Tertinggi
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {
                                  comparisonSummary.itemNames[
                                    comparisonSummary.highestCarbs
                                  ]
                                }{" "}
                                (
                                {
                                  comparisonSummary.carbs[
                                    comparisonSummary.highestCarbs
                                  ]
                                }{" "}
                                g)
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
