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
  ChartPie,
  ChartNoAxesCombined,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Printer,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useMemo, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";

// Import CSV data
import clusteringDataRaw from "@/constants/hasil-clustering.csv?raw";
import nutritionDataRaw from "@/constants/nutrition.csv?raw";

// Parse CSV data
function parseCSV(csvString: string) {
  const lines = csvString.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, "") || "";
      obj[header] = isNaN(Number(value)) ? value : Number(value);
    });
    return obj;
  });
}

// Normalize name for matching
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// Parse both datasets
const clusteringDataParsed = parseCSV(clusteringDataRaw);
const nutritionDataParsed = parseCSV(nutritionDataRaw);

// Create a map of nutrition data by normalized name
const nutritionMap = new Map<string, Record<string, string | number>>();
nutritionDataParsed.forEach((item) => {
  const normalizedName = normalizeName(String(item.name));
  nutritionMap.set(normalizedName, item);
});

// Merge clustering labels with actual nutrition values
interface MergedFoodItem {
  name: string;
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
  cluster: string;
  isMatched: boolean;
  image?: string;
}

const mergedData: MergedFoodItem[] = clusteringDataParsed.map((clusterItem) => {
  const clusterName = String(clusterItem.name);
  const normalizedClusterName = normalizeName(clusterName);

  let nutritionItem = nutritionMap.get(normalizedClusterName);

  if (!nutritionItem) {
    for (const [key, value] of nutritionMap.entries()) {
      if (
        key.includes(normalizedClusterName) ||
        normalizedClusterName.includes(key)
      ) {
        nutritionItem = value;
        break;
      }
    }
  }

  if (nutritionItem) {
    return {
      name: clusterName,
      calories: Number(nutritionItem.calories),
      proteins: Number(nutritionItem.proteins),
      fat: Number(nutritionItem.fat),
      carbohydrate: Number(nutritionItem.carbohydrate),
      cluster: String(clusterItem.cluster),
      isMatched: true,
      image: nutritionItem.image ? String(nutritionItem.image) : undefined,
    };
  }

  return {
    name: clusterName,
    calories: Number(clusterItem.calories),
    proteins: Number(clusterItem.proteins),
    fat: Number(clusterItem.fat),
    carbohydrate: Number(clusterItem.carbohydrate),
    cluster: String(clusterItem.cluster),
    isMatched: false,
  };
});

const COLORS = {
  safe: "#22c55e",
  unsafe: "#ef4444",
  calories: "#f97316",
  proteins: "#3b82f6",
  fat: "#eab308",
  carbs: "#a855f7",
};

export default function Visualisasi() {
  const [activeFilter, setActiveFilter] = useState<"all" | "safe" | "unsafe">(
    "all"
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Laporan Visualisasi Clustering MBG",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const matchedData = mergedData.filter((d) => d.isMatched);
    const safeCount = mergedData.filter(
      (d) => d.cluster === "cluster_0"
    ).length;
    const noiseCount = mergedData.filter((d) => d.cluster === "Noise").length;

    // Distribution for pie chart
    const distribution = [
      { name: "Aman", value: safeCount, fill: COLORS.safe },
      { name: "Tidak Aman", value: noiseCount, fill: COLORS.unsafe },
    ];

    // Calculate averages per cluster
    const safeItems = matchedData.filter((d) => d.cluster === "cluster_0");
    const unsafeItems = matchedData.filter((d) => d.cluster === "Noise");

    const avgSafe = {
      calories:
        safeItems.reduce((sum, d) => sum + d.calories, 0) / safeItems.length ||
        0,
      proteins:
        safeItems.reduce((sum, d) => sum + d.proteins, 0) / safeItems.length ||
        0,
      fat: safeItems.reduce((sum, d) => sum + d.fat, 0) / safeItems.length || 0,
      carbohydrate:
        safeItems.reduce((sum, d) => sum + d.carbohydrate, 0) /
          safeItems.length || 0,
    };

    const avgUnsafe = {
      calories:
        unsafeItems.reduce((sum, d) => sum + d.calories, 0) /
          unsafeItems.length || 0,
      proteins:
        unsafeItems.reduce((sum, d) => sum + d.proteins, 0) /
          unsafeItems.length || 0,
      fat:
        unsafeItems.reduce((sum, d) => sum + d.fat, 0) / unsafeItems.length ||
        0,
      carbohydrate:
        unsafeItems.reduce((sum, d) => sum + d.carbohydrate, 0) /
          unsafeItems.length || 0,
    };

    // Comparison bar chart data
    const comparisonData = [
      {
        nutrient: "Kalori",
        Aman: Math.round(avgSafe.calories),
        "Tidak Aman": Math.round(avgUnsafe.calories),
      },
      {
        nutrient: "Protein",
        Aman: Math.round(avgSafe.proteins * 10),
        "Tidak Aman": Math.round(avgUnsafe.proteins * 10),
      },
      {
        nutrient: "Lemak",
        Aman: Math.round(avgSafe.fat * 10),
        "Tidak Aman": Math.round(avgUnsafe.fat * 10),
      },
      {
        nutrient: "Karbohidrat",
        Aman: Math.round(avgSafe.carbohydrate * 10),
        "Tidak Aman": Math.round(avgUnsafe.carbohydrate * 10),
      },
    ];

    // Radar chart data for average profile comparison
    const radarData = [
      {
        nutrient: "Kalori",
        Aman: Math.min(avgSafe.calories / 5, 100),
        "Tidak Aman": Math.min(avgUnsafe.calories / 5, 100),
        fullMark: 100,
      },
      {
        nutrient: "Protein",
        Aman: Math.min(avgSafe.proteins * 2, 100),
        "Tidak Aman": Math.min(avgUnsafe.proteins * 2, 100),
        fullMark: 100,
      },
      {
        nutrient: "Lemak",
        Aman: Math.min(avgSafe.fat * 2, 100),
        "Tidak Aman": Math.min(avgUnsafe.fat * 2, 100),
        fullMark: 100,
      },
      {
        nutrient: "Karbohidrat",
        Aman: Math.min(avgSafe.carbohydrate, 100),
        "Tidak Aman": Math.min(avgUnsafe.carbohydrate, 100),
        fullMark: 100,
      },
    ];

    return {
      total: mergedData.length,
      matched: matchedData.length,
      safeCount,
      noiseCount,
      distribution,
      comparisonData,
      radarData,
      avgSafe,
      avgUnsafe,
    };
  }, []);

  // Filtered scatter data
  const scatterData = useMemo(() => {
    let data = mergedData.filter((d) => d.isMatched);

    if (activeFilter === "safe") {
      data = data.filter((d) => d.cluster === "cluster_0");
    } else if (activeFilter === "unsafe") {
      data = data.filter((d) => d.cluster === "Noise");
    }

    return data.map((d) => ({
      x: d.calories,
      y: d.proteins,
      z: Math.max(d.fat * 2 + 10, 10),
      carb: d.carbohydrate,
      name: d.name,
      cluster: d.cluster,
      fat: d.fat,
    }));
  }, [activeFilter]);

  const cluster0Data = scatterData.filter((d) => d.cluster === "cluster_0");
  const noiseData = scatterData.filter((d) => d.cluster === "Noise");

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
                  <BreadcrumbLink href="#">Clustering</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Visualisasi</BreadcrumbPage>
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
                Visualisasi Clustering
              </h1>
              <p className="text-muted-foreground">
                Eksplorasi detail hasil DBSCAN clustering bahan pangan MBG
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="mr-2 h-4 w-4" />
                Print Laporan
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                  >
                    Semua ({stats.total})
                  </Button>
                  <Button
                    variant={activeFilter === "safe" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("safe")}
                    className={
                      activeFilter === "safe"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                  >
                    Aman ({stats.safeCount})
                  </Button>
                  <Button
                    variant={activeFilter === "unsafe" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("unsafe")}
                    className={
                      activeFilter === "unsafe"
                        ? "bg-red-600 hover:bg-red-700"
                        : ""
                    }
                  >
                    Tidak Aman ({stats.noiseCount})
                  </Button>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  Menampilkan {scatterData.length} dari {stats.matched} data
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Visualization - Bubble Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ChartNoAxesCombined className="h-5 w-5" />
                    Scatter Plot 4D - Clustering DBSCAN
                  </CardTitle>
                  <CardDescription>
                    Visualisasi multi-dimensi: X=Kalori, Y=Protein,
                    Ukuran=Lemak, Warna=Klasifikasi
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Kalori"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Kalori (kkal/100g)",
                        position: "bottom",
                        offset: 20,
                      }}
                      domain={[0, "auto"]}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Protein"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Protein (g/100g)",
                        angle: -90,
                        position: "insideLeft",
                        offset: -10,
                      }}
                      domain={[0, "auto"]}
                    />
                    <ZAxis
                      type="number"
                      dataKey="z"
                      range={[30, 500]}
                      name="Lemak"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-4 shadow-lg">
                              <p className="font-bold text-base mb-2">
                                {data.name}
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <p>
                                  <span className="font-medium text-orange-600">
                                    Kalori:
                                  </span>{" "}
                                  {data.x} kkal
                                </p>
                                <p>
                                  <span className="font-medium text-blue-600">
                                    Protein:
                                  </span>{" "}
                                  {data.y}g
                                </p>
                                <p>
                                  <span className="font-medium text-yellow-600">
                                    Lemak:
                                  </span>{" "}
                                  {data.fat}g
                                </p>
                                <p>
                                  <span className="font-medium text-purple-600">
                                    Karbohidrat:
                                  </span>{" "}
                                  {data.carb}g
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    data.cluster === "Noise"
                                      ? "bg-red-500"
                                      : "bg-green-500"
                                  }`}
                                />
                                <span className="font-medium">
                                  {data.cluster === "Noise"
                                    ? "Tidak Aman"
                                    : "Aman"}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: 20 }}
                      formatter={(value) =>
                        value === "Aman"
                          ? "Aman (Cluster 0)"
                          : "Tidak Aman (Noise)"
                      }
                    />
                    <Scatter
                      name="Aman"
                      data={cluster0Data}
                      fill={COLORS.safe}
                      fillOpacity={0.7}
                    />
                    <Scatter
                      name="Tidak Aman"
                      data={noiseData}
                      fill={COLORS.unsafe}
                      fillOpacity={0.8}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend Explanation */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Cara Membaca Visualisasi</p>
                    <p className="text-sm text-muted-foreground">
                      Setiap titik mewakili satu bahan pangan dengan 4 dimensi
                      informasi.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 bg-gradient-to-r from-gray-200 to-gray-400 rounded" />
                    <span>Posisi X → Kalori</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-4 bg-gradient-to-t from-gray-200 to-gray-400 rounded" />
                    <span>Posisi Y → Protein</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                      <div className="h-4 w-4 rounded-full bg-gray-400" />
                    </div>
                    <span>Ukuran → Lemak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                    </div>
                    <span>Warna → Klasifikasi</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartPie className="h-5 w-5" />
                  Distribusi Klasifikasi
                </CardTitle>
                <CardDescription>
                  Perbandingan bahan pangan Aman vs Tidak Aman
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {stats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} bahan pangan`, ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.safeCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Bahan Aman</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {stats.noiseCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Tidak Aman</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart - Cluster Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartNoAxesCombined className="h-5 w-5" />
                  Profil Nutrisi Rata-rata
                </CardTitle>
                <CardDescription>
                  Perbandingan karakteristik nutrisi antar cluster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={stats.radarData}>
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="nutrient"
                        tick={{ fontSize: 12 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Aman"
                        dataKey="Aman"
                        stroke={COLORS.safe}
                        fill={COLORS.safe}
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Tidak Aman"
                        dataKey="Tidak Aman"
                        stroke={COLORS.unsafe}
                        fill={COLORS.unsafe}
                        fillOpacity={0.3}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Interpretasi:</p>
                  <p className="text-muted-foreground">
                    Cluster "Tidak Aman" cenderung memiliki nilai nutrisi yang
                    lebih ekstrem (sangat tinggi atau sangat rendah)
                    dibandingkan cluster "Aman" yang lebih seimbang.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Rata-rata Nutrisi per Cluster</CardTitle>
              <CardDescription>
                Nilai rata-rata kalori dan nutrisi makro (protein, lemak,
                karbohidrat ×10 untuk skala) per klasifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.comparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="nutrient" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                    <Bar
                      dataKey="Aman"
                      fill={COLORS.safe}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Tidak Aman"
                      fill={COLORS.unsafe}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cluster Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  Cluster Aman
                </CardTitle>
                <CardDescription>
                  Rata-rata nilai nutrisi bahan pangan dalam cluster aman
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Kalori
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgSafe.calories.toFixed(0)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        kkal
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Protein
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgSafe.proteins.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Lemak
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgSafe.fat.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Karbohidrat
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgSafe.carbohydrate.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  Cluster Tidak Aman
                </CardTitle>
                <CardDescription>
                  Rata-rata nilai nutrisi bahan pangan dalam cluster tidak aman
                  (noise)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Kalori
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgUnsafe.calories.toFixed(0)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        kkal
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Protein
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgUnsafe.proteins.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Lemak
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgUnsafe.fat.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata Karbohidrat
                    </p>
                    <p className="text-xl font-bold">
                      {stats.avgUnsafe.carbohydrate.toFixed(1)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        g
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Print Layout - positioned off-screen but rendered */}
        <div className="fixed -left-[9999px] top-0" style={{ width: "277mm" }}>
          <div ref={printRef} className="bg-white" style={{ padding: "8mm" }}>
            {/* Page 1: All in One Page */}
            <div style={{ height: "190mm", overflow: "hidden" }}>
              {/* Report Header */}
              <div className="flex items-center justify-between border-b-2 border-gray-300 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/bgn.png"
                    alt="BGN Logo"
                    className="h-12 w-12 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Badan Gizi Nasional
                    </h1>
                    <p className="text-xs text-gray-600">
                      Program Makan Bergizi Gratis (MBG)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Laporan Visualisasi Clustering
                  </h2>
                  <p className="text-xs text-gray-500">
                    Dicetak:{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Summary Cards - Compact */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-600">Total Bahan Pangan</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.matched}
                  </p>
                  <p className="text-xs text-gray-600">Data Tervalidasi</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.safeCount}
                  </p>
                  <p className="text-xs text-gray-600">Bahan Aman</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {stats.noiseCount}
                  </p>
                  <p className="text-xs text-gray-600">Tidak Aman</p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Pie Chart */}
                <div className="border border-gray-200 rounded p-3">
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">
                    Distribusi Klasifikasi
                  </h3>
                  <PieChart width={220} height={140}>
                    <Pie
                      data={stats.distribution}
                      cx={110}
                      cy={60}
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.distribution.map((entry, index) => (
                        <Cell key={`print-pie-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={20}
                      iconSize={8}
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                  <div className="flex justify-center gap-4 text-xs mt-1">
                    <span className="text-green-600 font-medium">
                      Aman: {((stats.safeCount / stats.total) * 100).toFixed(0)}
                      %
                    </span>
                    <span className="text-red-600 font-medium">
                      Tidak Aman:{" "}
                      {((stats.noiseCount / stats.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="border border-gray-200 rounded p-3">
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">
                    Profil Nutrisi Rata-rata
                  </h3>
                  <RadarChart width={220} height={160} data={stats.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="nutrient" tick={{ fontSize: 8 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 7 }}
                    />
                    <Radar
                      name="Aman"
                      dataKey="Aman"
                      stroke={COLORS.safe}
                      fill={COLORS.safe}
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Tidak Aman"
                      dataKey="Tidak Aman"
                      stroke={COLORS.unsafe}
                      fill={COLORS.unsafe}
                      fillOpacity={0.3}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                  </RadarChart>
                </div>

                {/* Cluster Stats */}
                <div className="space-y-2">
                  <div className="border-2 border-green-200 rounded p-2 bg-green-50/50">
                    <h3 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Cluster Aman (Rata-rata)
                    </h3>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Kalori</p>
                        <p className="font-bold">
                          {stats.avgSafe.calories.toFixed(0)} kkal
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Protein</p>
                        <p className="font-bold">
                          {stats.avgSafe.proteins.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Lemak</p>
                        <p className="font-bold">
                          {stats.avgSafe.fat.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Karbohidrat</p>
                        <p className="font-bold">
                          {stats.avgSafe.carbohydrate.toFixed(1)}g
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-red-200 rounded p-2 bg-red-50/50">
                    <h3 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Cluster Tidak Aman (Rata-rata)
                    </h3>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Kalori</p>
                        <p className="font-bold">
                          {stats.avgUnsafe.calories.toFixed(0)} kkal
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Protein</p>
                        <p className="font-bold">
                          {stats.avgUnsafe.proteins.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Lemak</p>
                        <p className="font-bold">
                          {stats.avgUnsafe.fat.toFixed(1)}g
                        </p>
                      </div>
                      <div className="bg-white rounded p-1">
                        <p className="text-gray-500 text-[10px]">Karbohidrat</p>
                        <p className="font-bold">
                          {stats.avgUnsafe.carbohydrate.toFixed(1)}g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Charts */}
              <div className="grid grid-cols-2 gap-3">
                {/* Scatter Plot */}
                <div className="border border-gray-200 rounded p-2">
                  <h3 className="text-sm font-semibold mb-1 text-gray-800">
                    Scatter Plot 4D - Visualisasi Clustering
                  </h3>
                  <p className="text-[10px] text-gray-600 mb-1">
                    X=Kalori, Y=Protein, Ukuran=Lemak, Warna=Klasifikasi
                  </p>
                  <ScatterChart
                    width={380}
                    height={130}
                    margin={{ top: 10, right: 10, bottom: 25, left: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="x"
                      tick={{ fontSize: 8 }}
                      label={{
                        value: "Kalori (kkal)",
                        position: "bottom",
                        offset: 5,
                        fontSize: 8,
                      }}
                      domain={[0, "auto"]}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      tick={{ fontSize: 8 }}
                      label={{
                        value: "Protein (g)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        fontSize: 8,
                      }}
                      domain={[0, "auto"]}
                    />
                    <ZAxis type="number" dataKey="z" range={[10, 100]} />
                    <Scatter
                      name="Aman"
                      data={cluster0Data}
                      fill={COLORS.safe}
                      fillOpacity={0.6}
                    />
                    <Scatter
                      name="Tidak Aman"
                      data={noiseData}
                      fill={COLORS.unsafe}
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </div>

                {/* Bar Chart */}
                <div className="border border-gray-200 rounded p-2">
                  <h3 className="text-sm font-semibold mb-1 text-gray-800">
                    Perbandingan Rata-rata Nutrisi
                  </h3>
                  <BarChart
                    width={380}
                    height={140}
                    data={stats.comparisonData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="nutrient" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                    <Bar
                      dataKey="Aman"
                      fill={COLORS.safe}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Tidak Aman"
                      fill={COLORS.unsafe}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
                <p>
                  Metode: DBSCAN Clustering | Tool: RapidMiner | ©{" "}
                  {new Date().getFullYear()} Badan Gizi Nasional
                </p>
                <p>Halaman 1 dari 1</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
