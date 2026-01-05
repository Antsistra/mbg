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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFoodItems,
  searchFoodItems,
  createMenu,
  getMenuWithItems,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  updateMenu,
  getNutritionStandard,
} from "@/services/menuService";
import type {
  FoodItem,
  MenuItemWithFood,
  NutritionStandard,
  MealType,
  TargetAudience,
} from "@/types/database";
import { TARGET_AUDIENCE_LABELS } from "@/types/database";

// Nutrition progress component
function NutritionProgress({
  label,
  value,
  min,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isInRange = value >= min && value <= max;
  const isBelowMin = value < min;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
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
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}

export default function SusunMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { menuId } = useParams();

  // Form state
  const [menuName, setMenuName] = useState("");
  const [menuDescription, setMenuDescription] = useState("");
  const [mealType, setMealType] = useState<MealType>("makan_siang");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("sd");
  const [servingSize, setServingSize] = useState(1);

  // Menu items
  const [menuItems, setMenuItems] = useState<MenuItemWithFood[]>([]);
  const [nutritionStandard, setNutritionStandard] =
    useState<NutritionStandard | null>(null);

  // Food search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingMenuId, setExistingMenuId] = useState<string | null>(
    menuId || null
  );

  // Load nutrition standard when meal type or target audience changes
  useEffect(() => {
    async function loadStandard() {
      try {
        const standard = await getNutritionStandard(targetAudience, mealType);
        setNutritionStandard(standard);
      } catch (error) {
        console.error("Failed to load nutrition standard:", error);
      }
    }
    loadStandard();
  }, [mealType, targetAudience]);

  // Load existing menu if editing
  useEffect(() => {
    async function loadMenu() {
      if (!menuId) return;

      setIsLoading(true);
      try {
        const menu = await getMenuWithItems(menuId);
        setMenuName(menu.name);
        setMenuDescription(menu.description || "");
        setMealType(menu.meal_type);
        setTargetAudience(menu.target_audience);
        setServingSize(menu.serving_size);
        setMenuItems(menu.items);
        setExistingMenuId(menu.id);
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, [menuId]);

  // Search for food items
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFoodItems(query, 30);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Load initial food items
  useEffect(() => {
    async function loadInitialFoods() {
      try {
        const foods = await getFoodItems({ limit: 50, cluster: "cluster_0" });
        setSearchResults(foods);
      } catch (error) {
        console.error("Failed to load foods:", error);
      }
    }
    if (dialogOpen && searchQuery.length < 2) {
      loadInitialFoods();
    }
  }, [dialogOpen, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    return menuItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        proteins: acc.proteins + item.proteins,
        fat: acc.fat + item.fat,
        carbohydrate: acc.carbohydrate + item.carbohydrate,
      }),
      { calories: 0, proteins: 0, fat: 0, carbohydrate: 0 }
    );
  }, [menuItems]);

  // Add food item to menu
  const handleAddItem = async (food: FoodItem, quantity: number = 100) => {
    // Check if already added
    if (menuItems.some((item) => item.food_item_id === food.id)) {
      return;
    }

    // Calculate nutrition for quantity
    const calories = (food.calories * quantity) / 100;
    const proteins = (food.proteins * quantity) / 100;
    const fat = (food.fat * quantity) / 100;
    const carbohydrate = (food.carbohydrate * quantity) / 100;

    // If menu exists, save to database
    if (existingMenuId) {
      try {
        const newItem = await addMenuItem({
          menu_id: existingMenuId,
          food_item_id: food.id,
          quantity,
        });
        setMenuItems((prev) => [...prev, newItem as MenuItemWithFood]);
      } catch (error) {
        console.error("Failed to add item:", error);
      }
    } else {
      // Add locally for new menu
      const tempItem: MenuItemWithFood = {
        id: `temp-${Date.now()}`,
        menu_id: "",
        food_item_id: food.id,
        quantity,
        calories,
        proteins,
        fat,
        carbohydrate,
        notes: null,
        created_at: new Date().toISOString(),
        food_item: food,
      };
      setMenuItems((prev) => [...prev, tempItem]);
    }

    setDialogOpen(false);
  };

  // Update item quantity
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;

    const calories = (item.food_item.calories * quantity) / 100;
    const proteins = (item.food_item.proteins * quantity) / 100;
    const fat = (item.food_item.fat * quantity) / 100;
    const carbohydrate = (item.food_item.carbohydrate * quantity) / 100;

    if (existingMenuId && !itemId.startsWith("temp-")) {
      try {
        await updateMenuItem(itemId, { quantity });
      } catch (error) {
        console.error("Failed to update item:", error);
      }
    }

    setMenuItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity, calories, proteins, fat, carbohydrate }
          : i
      )
    );
  };

  // Remove item
  const handleRemoveItem = async (itemId: string) => {
    if (existingMenuId && !itemId.startsWith("temp-")) {
      try {
        await removeMenuItem(itemId);
      } catch (error) {
        console.error("Failed to remove item:", error);
      }
    }

    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Save menu
  const handleSave = async () => {
    if (!user || !menuName.trim()) return;

    setIsSaving(true);
    try {
      if (existingMenuId) {
        // Update existing menu
        await updateMenu(existingMenuId, {
          name: menuName,
          description: menuDescription || null,
          meal_type: mealType,
          target_audience: targetAudience,
          serving_size: servingSize,
        });
        navigate("/menu");
      } else {
        // Create new menu
        const newMenu = await createMenu(
          {
            name: menuName,
            description: menuDescription,
            meal_type: mealType,
            target_audience: targetAudience,
            serving_size: servingSize,
          },
          user.id
        );

        // Add all items to the new menu
        for (const item of menuItems) {
          await addMenuItem({
            menu_id: newMenu.id,
            food_item_id: item.food_item_id,
            quantity: item.quantity,
          });
        }

        navigate("/menu");
      }
    } catch (error) {
      console.error("Failed to save menu:", error);
    } finally {
      setIsSaving(false);
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
                  <BreadcrumbLink href="/menu">Menu MBG</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {menuId ? "Edit Menu" : "Susun Menu"}
                  </BreadcrumbPage>
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
                {menuId ? "Edit Menu" : "Susun Menu Baru"}
              </h1>
              <p className="text-muted-foreground">
                Susun menu MBG dengan bahan pangan yang aman dan bergizi
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !menuName.trim()}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Menu
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left Column - Menu Info & Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Menu Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Informasi Menu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="menu-name">Nama Menu *</Label>
                      <Input
                        id="menu-name"
                        placeholder="Contoh: Menu Makan Siang SD Hari Senin"
                        value={menuName}
                        onChange={(e) => setMenuName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serving-size">Porsi</Label>
                      <Input
                        id="serving-size"
                        type="number"
                        min={1}
                        value={servingSize}
                        onChange={(e) =>
                          setServingSize(parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Target Sasaran</Label>
                      <Select
                        value={targetAudience}
                        onValueChange={(v) =>
                          setTargetAudience(v as TargetAudience)
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      placeholder="Deskripsi menu (opsional)"
                      value={menuDescription}
                      onChange={(e) => setMenuDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Bahan Pangan</CardTitle>
                      <CardDescription>
                        {menuItems.length} bahan dipilih
                      </CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Bahan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Tambah Bahan Pangan</DialogTitle>
                          <DialogDescription>
                            Cari dan pilih bahan pangan untuk ditambahkan ke
                            menu
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Cari bahan pangan..."
                              className="pl-10"
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                            />
                          </div>
                          <ScrollArea className="h-[400px]">
                            {isSearching ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {searchResults.map((food) => {
                                  const isAdded = menuItems.some(
                                    (item) => item.food_item_id === food.id
                                  );
                                  return (
                                    <div
                                      key={food.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        isAdded
                                          ? "bg-muted opacity-60"
                                          : "hover:bg-muted/50 cursor-pointer"
                                      }`}
                                      onClick={() =>
                                        !isAdded && handleAddItem(food)
                                      }
                                    >
                                      <div className="flex items-center gap-3">
                                        {food.image ? (
                                          <img
                                            src={food.image}
                                            alt={food.name}
                                            className="h-12 w-12 rounded object-cover"
                                          />
                                        ) : (
                                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                            <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                              {food.name}
                                            </p>
                                            <Badge
                                              variant={
                                                food.cluster === "cluster_0"
                                                  ? "default"
                                                  : "destructive"
                                              }
                                              className="text-xs"
                                            >
                                              {food.cluster === "cluster_0"
                                                ? "Aman"
                                                : "Tidak Aman"}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {food.calories} kkal | P:{" "}
                                            {food.proteins}g | L: {food.fat}g |
                                            K: {food.carbohydrate}g
                                          </p>
                                        </div>
                                      </div>
                                      {isAdded ? (
                                        <Badge variant="secondary">
                                          Sudah ditambahkan
                                        </Badge>
                                      ) : (
                                        <Button size="sm" variant="ghost">
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {menuItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Belum ada bahan pangan yang dipilih</p>
                      <p className="text-sm">
                        Klik "Tambah Bahan" untuk menambahkan
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                        >
                          {item.food_item.image ? (
                            <img
                              src={item.food_item.image}
                              alt={item.food_item.name}
                              className="h-14 w-14 rounded object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {item.food_item.name}
                              </p>
                              {item.food_item.cluster === "Noise" && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Tidak Aman
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.calories.toFixed(1)} kkal | P:{" "}
                              {item.proteins.toFixed(1)}g | L:{" "}
                              {item.fat.toFixed(1)}g | K:{" "}
                              {item.carbohydrate.toFixed(1)}g
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                className="w-20 text-center"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(
                                    item.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                min={0}
                              />
                              <span className="text-sm text-muted-foreground">
                                g
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Nutrition Summary */}
            <div className="space-y-4">
              {/* Nutrition Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Nutrisi</CardTitle>
                  <CardDescription>
                    Total nutrisi menu per porsi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nutritionStandard ? (
                    <>
                      <NutritionProgress
                        label="Kalori"
                        value={totals.calories}
                        min={nutritionStandard.min_calories}
                        max={nutritionStandard.max_calories}
                        unit="kkal"
                        color="bg-orange-500"
                      />
                      <NutritionProgress
                        label="Protein"
                        value={totals.proteins}
                        min={nutritionStandard.min_proteins}
                        max={nutritionStandard.max_proteins}
                        unit="g"
                        color="bg-blue-500"
                      />
                      <NutritionProgress
                        label="Lemak"
                        value={totals.fat}
                        min={nutritionStandard.min_fat}
                        max={nutritionStandard.max_fat}
                        unit="g"
                        color="bg-yellow-500"
                      />
                      <NutritionProgress
                        label="Karbohidrat"
                        value={totals.carbohydrate}
                        min={nutritionStandard.min_carbohydrate}
                        max={nutritionStandard.max_carbohydrate}
                        unit="g"
                        color="bg-purple-500"
                      />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Kalori</span>
                        <span className="font-semibold">
                          {totals.calories.toFixed(1)} kkal
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protein</span>
                        <span className="font-semibold">
                          {totals.proteins.toFixed(1)} g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lemak</span>
                        <span className="font-semibold">
                          {totals.fat.toFixed(1)} g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Karbohidrat</span>
                        <span className="font-semibold">
                          {totals.carbohydrate.toFixed(1)} g
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Standard Info */}
              {nutritionStandard && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Standar Gizi</CardTitle>
                    <CardDescription className="text-xs">
                      {TARGET_AUDIENCE_LABELS[targetAudience]} - Makan Siang
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {nutritionStandard.description}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
