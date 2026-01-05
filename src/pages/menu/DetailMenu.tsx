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
import {
  UtensilsCrossed,
  Pencil,
  Printer,
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { getMenuWithItems, getNutritionStandard } from "@/services/menuService";
import type { MenuWithItems, NutritionStandard } from "@/types/database";
import { TARGET_AUDIENCE_LABELS } from "@/types/database";

export default function DetailMenu() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [menu, setMenu] = useState<MenuWithItems | null>(null);
  const [nutritionStandard, setNutritionStandard] =
    useState<NutritionStandard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: menu?.name || "Menu MBG",
  });

  useEffect(() => {
    async function loadMenu() {
      if (!menuId) return;

      setIsLoading(true);
      try {
        const data = await getMenuWithItems(menuId);
        setMenu(data);

        // Load nutrition standard for this menu
        const standard = await getNutritionStandard(
          data.target_audience,
          data.meal_type
        );
        setNutritionStandard(standard);
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, [menuId]);

  const getNutritionStatus = (
    value: number,
    min: number,
    max: number
  ): "low" | "ok" | "high" => {
    if (value < min) return "low";
    if (value > max) return "high";
    return "ok";
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

  if (!menu) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen flex-col items-center justify-center gap-4">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Menu tidak ditemukan</p>
            <Button asChild variant="outline">
              <Link to="/menu">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar Menu
              </Link>
            </Button>
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
                  <BreadcrumbPage>{menu.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/menu")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {menu.name}
                </h1>
                <p className="text-muted-foreground">
                  {menu.description || "Tidak ada deskripsi"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handlePrint()}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak
              </Button>
              <Button asChild>
                <Link to={`/menu/edit/${menu.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Menu
                </Link>
              </Button>
            </div>
          </div>

          {/* Printable Content */}
          <div ref={printRef} className="print:p-8">
            {/* Print Header (only visible when printing) */}
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-bold">{menu.name}</h1>
              <p className="text-gray-600">{menu.description}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left Column - Menu Info & Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Menu Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {TARGET_AUDIENCE_LABELS[menu.target_audience]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>{menu.serving_size} porsi</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Dibuat:{" "}
                          {new Date(menu.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Diubah:{" "}
                          {new Date(menu.updated_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Menu Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daftar Bahan Pangan</CardTitle>
                    <CardDescription>
                      {menu.items.length} bahan pangan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">
                              Bahan
                            </th>
                            <th className="text-center py-2 font-medium">
                              Status
                            </th>
                            <th className="text-right py-2 font-medium">
                              Qty (g)
                            </th>
                            <th className="text-right py-2 font-medium">
                              Kalori
                            </th>
                            <th className="text-right py-2 font-medium">
                              Protein
                            </th>
                            <th className="text-right py-2 font-medium">
                              Lemak
                            </th>
                            <th className="text-right py-2 font-medium">
                              Karbo
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {menu.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b last:border-0"
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  {item.food_item.image ? (
                                    <img
                                      src={item.food_item.image}
                                      alt={item.food_item.name}
                                      className="h-8 w-8 rounded object-cover print:hidden"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center print:hidden">
                                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {item.food_item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <Badge
                                  variant={
                                    item.food_item.cluster === "cluster_0"
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {item.food_item.cluster === "cluster_0"
                                    ? "Aman"
                                    : "Tidak Aman"}
                                </Badge>
                              </td>
                              <td className="py-3 text-right">
                                {item.quantity}
                              </td>
                              <td className="py-3 text-right">
                                {item.calories.toFixed(1)}
                              </td>
                              <td className="py-3 text-right">
                                {item.proteins.toFixed(1)}g
                              </td>
                              <td className="py-3 text-right">
                                {item.fat.toFixed(1)}g
                              </td>
                              <td className="py-3 text-right">
                                {item.carbohydrate.toFixed(1)}g
                              </td>
                            </tr>
                          ))}
                          {/* Totals row */}
                          <tr className="font-semibold bg-muted/50">
                            <td className="py-3" colSpan={2}>
                              Total
                            </td>
                            <td className="py-3 text-right">
                              {menu.items
                                .reduce((sum, i) => sum + i.quantity, 0)
                                .toFixed(0)}
                            </td>
                            <td className="py-3 text-right">
                              {menu.total_calories?.toFixed(1) || 0}
                            </td>
                            <td className="py-3 text-right">
                              {menu.total_proteins?.toFixed(1) || 0}g
                            </td>
                            <td className="py-3 text-right">
                              {menu.total_fat?.toFixed(1) || 0}g
                            </td>
                            <td className="py-3 text-right">
                              {menu.total_carbohydrate?.toFixed(1) || 0}g
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Nutrition Summary */}
              <div className="space-y-4">
                {/* Nutrition Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ringkasan Nutrisi</CardTitle>
                    <CardDescription>Per porsi menu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {nutritionStandard ? (
                        <>
                          <NutritionRow
                            label="Kalori"
                            value={menu.total_calories || 0}
                            unit="kkal"
                            status={getNutritionStatus(
                              menu.total_calories || 0,
                              nutritionStandard.min_calories,
                              nutritionStandard.max_calories
                            )}
                            min={nutritionStandard.min_calories}
                            max={nutritionStandard.max_calories}
                          />
                          <NutritionRow
                            label="Protein"
                            value={menu.total_proteins || 0}
                            unit="g"
                            status={getNutritionStatus(
                              menu.total_proteins || 0,
                              nutritionStandard.min_proteins,
                              nutritionStandard.max_proteins
                            )}
                            min={nutritionStandard.min_proteins}
                            max={nutritionStandard.max_proteins}
                          />
                          <NutritionRow
                            label="Lemak"
                            value={menu.total_fat || 0}
                            unit="g"
                            status={getNutritionStatus(
                              menu.total_fat || 0,
                              nutritionStandard.min_fat,
                              nutritionStandard.max_fat
                            )}
                            min={nutritionStandard.min_fat}
                            max={nutritionStandard.max_fat}
                          />
                          <NutritionRow
                            label="Karbohidrat"
                            value={menu.total_carbohydrate || 0}
                            unit="g"
                            status={getNutritionStatus(
                              menu.total_carbohydrate || 0,
                              nutritionStandard.min_carbohydrate,
                              nutritionStandard.max_carbohydrate
                            )}
                            min={nutritionStandard.min_carbohydrate}
                            max={nutritionStandard.max_carbohydrate}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span>Kalori</span>
                            <span className="font-semibold">
                              {menu.total_calories?.toFixed(1) || 0} kkal
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Protein</span>
                            <span className="font-semibold">
                              {menu.total_proteins?.toFixed(1) || 0} g
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>Lemak</span>
                            <span className="font-semibold">
                              {menu.total_fat?.toFixed(1) || 0} g
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span>Karbohidrat</span>
                            <span className="font-semibold">
                              {menu.total_carbohydrate?.toFixed(1) || 0} g
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Standard Info */}
                {nutritionStandard && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Standar Gizi</CardTitle>
                      <CardDescription className="text-xs">
                        {TARGET_AUDIENCE_LABELS[menu.target_audience]} - Makan
                        Siang
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p className="text-muted-foreground">
                        {nutritionStandard.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <p className="font-medium">Kalori</p>
                          <p className="text-muted-foreground">
                            {nutritionStandard.min_calories} -{" "}
                            {nutritionStandard.max_calories} kkal
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Protein</p>
                          <p className="text-muted-foreground">
                            {nutritionStandard.min_proteins} -{" "}
                            {nutritionStandard.max_proteins} g
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Lemak</p>
                          <p className="text-muted-foreground">
                            {nutritionStandard.min_fat} -{" "}
                            {nutritionStandard.max_fat} g
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Karbohidrat</p>
                          <p className="text-muted-foreground">
                            {nutritionStandard.min_carbohydrate} -{" "}
                            {nutritionStandard.max_carbohydrate} g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NutritionRow({
  label,
  value,
  unit,
  status,
  min,
  max,
}: {
  label: string;
  value: number;
  unit: string;
  status: "low" | "ok" | "high";
  min: number;
  max: number;
}) {
  const statusColor = {
    low: "text-yellow-600",
    ok: "text-green-600",
    high: "text-red-600",
  };

  const statusLabel = {
    low: "Kurang",
    ok: "Cukup",
    high: "Lebih",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Target: {min} - {max} {unit}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${statusColor[status]}`}>
          {value.toFixed(1)} {unit}
        </p>
        <p className={`text-xs ${statusColor[status]}`}>
          {statusLabel[status]}
        </p>
      </div>
    </div>
  );
}
