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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Apple,
  Search,
  Loader2,
  Grid3X3,
  List,
  Filter,
  Flame,
  Beef,
  Droplets,
  Wheat,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getFoodItems } from "@/services/menuService";
import type { FoodItem } from "@/types/database";

// Items per page options
const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

// Food item detail dialog
function FoodDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: FoodItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Informasi kandungan gizi per 100 gram
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {item.image && (
            <div className="rounded-lg overflow-hidden h-48">
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

          <div className="flex items-center gap-2">
            <Badge
              variant={item.cluster === "cluster_0" ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {item.cluster === "cluster_0" ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Aman Dikonsumsi
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3 w-3" />
                  Tidak Aman
                </>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
              <div className="p-2 rounded-full bg-orange-100">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kalori</p>
                <p className="font-semibold">{item.calories} kkal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="p-2 rounded-full bg-red-100">
                <Beef className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="font-semibold">{item.proteins} g</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
              <div className="p-2 rounded-full bg-yellow-100">
                <Droplets className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lemak</p>
                <p className="font-semibold">{item.fat} g</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="p-2 rounded-full bg-amber-100">
                <Wheat className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Karbohidrat</p>
                <p className="font-semibold">{item.carbohydrate} g</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Food item card component
function FoodItemCard({
  item,
  onViewDetail,
}: {
  item: FoodItem;
  onViewDetail: () => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative h-32 bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Apple className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge
          variant={item.cluster === "cluster_0" ? "default" : "destructive"}
          className="absolute top-2 right-2 text-xs"
        >
          {item.cluster === "cluster_0" ? "Aman" : "Tidak Aman"}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm line-clamp-2">{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Flame className="h-3 w-3" />
            <span>{item.calories} kkal</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Beef className="h-3 w-3" />
            <span>{item.proteins}g protein</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Droplets className="h-3 w-3" />
            <span>{item.fat}g lemak</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wheat className="h-3 w-3" />
            <span>{item.carbohydrate}g karbo</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewDetail}
        >
          <Eye className="mr-2 h-3 w-3" />
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );
}

// Food item row component for list view
function FoodItemRow({
  item,
  onViewDetail,
}: {
  item: FoodItem;
  onViewDetail: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Apple className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{item.name}</h3>
          <Badge
            variant={item.cluster === "cluster_0" ? "default" : "destructive"}
            className="text-xs flex-shrink-0"
          >
            {item.cluster === "cluster_0" ? "Aman" : "Tidak Aman"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {item.calories} kkal
          </span>
          <span className="flex items-center gap-1">
            <Beef className="h-3 w-3" />
            {item.proteins}g
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {item.fat}g
          </span>
          <span className="flex items-center gap-1">
            <Wheat className="h-3 w-3" />
            {item.carbohydrate}g
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onViewDetail}>
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function DaftarBahan() {
  // State
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [clusterFilter, setClusterFilter] = useState<
    "all" | "cluster_0" | "Noise"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Load food items
  useEffect(() => {
    async function loadFoodItems() {
      setIsLoading(true);
      try {
        const items = await getFoodItems({ limit: 2000 });
        setFoodItems(items);
      } catch (error) {
        console.error("Failed to load food items:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFoodItems();
  }, []);

  // Filter and search items
  const filteredItems = useMemo(() => {
    let items = foodItems;

    // Apply cluster filter
    if (clusterFilter !== "all") {
      items = items.filter((item) => item.cluster === clusterFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }

    return items;
  }, [foodItems, clusterFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, clusterFilter, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: foodItems.length,
      safe: foodItems.filter((i) => i.cluster === "cluster_0").length,
      unsafe: foodItems.filter((i) => i.cluster === "Noise").length,
    };
  }, [foodItems]);

  const handleViewDetail = (item: FoodItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
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
                  <BreadcrumbPage>Bahan Pangan</BreadcrumbPage>
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
                Daftar Bahan Pangan
              </h1>
              <p className="text-muted-foreground">
                Database bahan pangan dengan informasi gizi dan status keamanan
              </p>
            </div>
            <Button asChild>
              <Link to="/bahan-pangan/bandingkan">
                <Scale className="mr-2 h-4 w-4" />
                Bandingkan
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Bahan Pangan</CardDescription>
                <CardTitle className="text-3xl">1188</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Aman Dikonsumsi
                </CardDescription>
                <CardTitle className="text-3xl text-green-600">1111</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  Tidak Aman
                </CardDescription>
                <CardTitle className="text-3xl text-red-600">77</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters and View Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari bahan pangan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Cluster Filter */}
                <Select
                  value={clusterFilter}
                  onValueChange={(value) =>
                    setClusterFilter(value as "all" | "cluster_0" | "Noise")
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="cluster_0">Aman Dikonsumsi</SelectItem>
                    <SelectItem value="Noise">Tidak Aman</SelectItem>
                  </SelectContent>
                </Select>

                {/* Items per page */}
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} per halaman
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan {paginatedItems.length} dari {filteredItems.length}{" "}
              bahan pangan
              {searchQuery && ` untuk "${searchQuery}"`}
            </span>
            <span>
              Halaman {currentPage} dari {totalPages || 1}
            </span>
          </div>

          {/* Food Items Display */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Apple className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  Tidak ada bahan pangan ditemukan
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery
                    ? `Tidak ada hasil untuk "${searchQuery}"`
                    : "Tidak ada data bahan pangan"}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {paginatedItems.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onViewDetail={() => handleViewDetail(item)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedItems.map((item) => (
                <FoodItemRow
                  key={item.id}
                  item={item}
                  onViewDetail={() => handleViewDetail(item)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <FoodDetailDialog
          item={selectedItem}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
