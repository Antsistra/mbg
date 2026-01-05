import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import { useAuth } from "@/contexts/AuthContext";
import {
  Apple,
  ChartPie,
  AlertTriangle,
  Flame,
  ChartNoAxesCombined,
  UtensilsCrossed,
  Upload,
  Scale,
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
} from "recharts";
import { useMemo } from "react";

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

// Normalize name for matching (lowercase, trim, remove extra spaces)
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

  // Try exact match first
  let nutritionItem = nutritionMap.get(normalizedClusterName);

  // If no exact match, try partial matching
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

  // If no match found, use normalized values (fallback)
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

// Calculate statistics using merged data with real values
function calculateStats(data: MergedFoodItem[]) {
  const totalItems = data.length;
  const matchedItems = data.filter((d) => d.isMatched).length;
  const clusters = [...new Set(data.map((d) => d.cluster))];
  const noiseCount = data.filter((d) => d.cluster === "Noise").length;
  const clusterCount = clusters.filter((c) => c !== "Noise").length;
  const safeCount = data.filter((d) => d.cluster === "cluster_0").length;

  // Only use matched items for accurate stats
  const matchedData = data.filter((d) => d.isMatched);
  const avgCalories =
    matchedData.length > 0
      ? matchedData.reduce((sum, d) => sum + d.calories, 0) / matchedData.length
      : 0;
  const avgProteins =
    matchedData.length > 0
      ? matchedData.reduce((sum, d) => sum + d.proteins, 0) / matchedData.length
      : 0;

  // Distribution for pie chart - now showing Aman vs Tidak Aman
  const distribution = [
    {
      name: "Aman",
      value: safeCount,
      cluster: "cluster_0",
    },
    {
      name: "Tidak Aman",
      value: noiseCount,
      cluster: "Noise",
    },
  ];

  // Top 5 by protein
  const topProtein = [...data]
    .sort((a, b) => Number(b.proteins) - Number(a.proteins))
    .slice(0, 5);

  // Top 5 by calories
  const topCalories = [...data]
    .sort((a, b) => Number(b.calories) - Number(a.calories))
    .slice(0, 5);

  // Top 5 Balanced Foods - only from matched & safe items
  // For real nutrition values, we need different balance criteria
  const balancedFoods = [...data]
    .filter((item) => item.cluster !== "Noise" && item.isMatched)
    .map((item) => {
      // Calculate balance based on having moderate amounts of each nutrient
      // Ideal: balanced distribution across protein, fat, carbs for a meal
      const totalMacros = item.proteins + item.fat + item.carbohydrate;
      if (totalMacros === 0) {
        return { ...item, balanceScore: Infinity };
      }

      // Calculate percentage of each macro
      const proteinPct = ((item.proteins * 4) / (item.calories || 1)) * 100; // protein cal %
      const fatPct = ((item.fat * 9) / (item.calories || 1)) * 100; // fat cal %
      const carbPct = ((item.carbohydrate * 4) / (item.calories || 1)) * 100; // carb cal %

      // Ideal macro distribution (roughly): 15-25% protein, 20-35% fat, 45-65% carbs
      // Score how close to ideal (lower = better)
      const proteinDev = Math.abs(proteinPct - 20);
      const fatDev = Math.abs(fatPct - 25);
      const carbDev = Math.abs(carbPct - 55);

      const balanceScore = proteinDev + fatDev + carbDev;

      return {
        ...item,
        balanceScore,
      };
    })
    .filter((item) => item.balanceScore !== Infinity && item.calories > 0)
    .sort((a, b) => a.balanceScore - b.balanceScore)
    .slice(0, 5);

  return {
    totalItems,
    matchedItems,
    safeCount,
    clusterCount,
    noiseCount,
    avgCalories,
    avgProteins,
    distribution,
    topProtein,
    topCalories,
    balancedFoods,
  };
}

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

export default function Dashboard() {
  const { user } = useAuth();
  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const stats = useMemo(() => calculateStats(mergedData), []);

  // Prepare scatter data with all 4 dimensions for bubble chart
  // Using real nutrition values from merged data
  const scatterData = useMemo(() => {
    return mergedData
      .filter((d) => d.isMatched) // Only use matched items with real values
      .map((d) => ({
        x: d.calories,
        y: d.proteins,
        z: Math.max(d.fat * 2 + 10, 10), // size based on fat (scaled for visibility)
        carb: d.carbohydrate,
        name: d.name,
        cluster: d.cluster,
        fat: d.fat,
      }));
  }, []);

  const cluster0Data = scatterData.filter((d) => d.cluster === "cluster_0");
  const noiseData = scatterData.filter((d) => d.cluster === "Noise");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Welcome Section */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat Datang, {userName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Berikut ringkasan data clustering bahan pangan MBG
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Bahan Pangan
                </CardTitle>
                <Apple className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.matchedItems} item dengan data nutrisi lengkap
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Bahan Aman
                </CardTitle>
                <ChartPie className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.safeCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bahan pangan terklasifikasi aman
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Bahan Tidak Aman
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.noiseCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bahan pangan outlier (perlu perhatian)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata Kalori
                </CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgCalories.toFixed(0)} kkal
                </div>
                <p className="text-xs text-muted-foreground">
                  Per 100g bahan pangan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row - Pie Chart left, Top 5 right */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Pie Chart - Distribusi Keamanan */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartPie className="h-5 w-5" />
                  Klasifikasi Keamanan Bahan Pangan
                </CardTitle>
                <CardDescription>
                  Hasil clustering DBSCAN: Aman vs Tidak Aman
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {stats.distribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  {stats.distribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top 5 Balanced Foods */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Top 5 Bahan Pangan Seimbang
                </CardTitle>
                <CardDescription>
                  Bahan dengan komposisi nutrisi paling seimbang untuk MBG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.balancedFoods.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="ml-4 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {String(item.name)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kal: {Number(item.calories).toFixed(2)} | Pro:{" "}
                          {Number(item.proteins).toFixed(2)} | Lem:{" "}
                          {Number(item.fat).toFixed(2)} | Karb:{" "}
                          {Number(item.carbohydrate).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        Skor: {item.balanceScore.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4D Bubble Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartNoAxesCombined className="h-5 w-5" />
                Visualisasi Clustering 4D
              </CardTitle>
              <CardDescription>
                Bubble chart: X=Kalori (kkal), Y=Protein (g), Ukuran=Lemak,
                Warna=Klasifikasi (Hijau=Aman, Merah=Tidak Aman)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                  >
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Kalori"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Kalori (kkal/100g)",
                        position: "bottom",
                        offset: 10,
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
                        offset: -5,
                      }}
                      domain={[0, "auto"]}
                    />
                    <ZAxis
                      type="number"
                      dataKey="z"
                      range={[20, 400]}
                      name="Lemak"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="font-semibold text-sm mb-2">
                                {data.name}
                              </p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-orange-600">
                                    Kalori:
                                  </span>{" "}
                                  {data.x} kkal
                                </p>
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-blue-600">
                                    Protein:
                                  </span>{" "}
                                  {data.y}g
                                </p>
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-yellow-600">
                                    Lemak:
                                  </span>{" "}
                                  {data.fat}g
                                </p>
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-purple-600">
                                    Karbohidrat:
                                  </span>{" "}
                                  {data.carb}g
                                </p>
                              </div>
                              <p className="text-xs mt-2 pt-2 border-t">
                                Klasifikasi:{" "}
                                <span
                                  className={
                                    data.cluster === "Noise"
                                      ? "text-red-600 font-medium"
                                      : "text-green-600 font-medium"
                                  }
                                >
                                  {data.cluster === "Noise"
                                    ? "Tidak Aman"
                                    : "Aman"}
                                </span>
                              </p>
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
                        value === "Cluster 0" ? "Aman" : "Tidak Aman"
                      }
                    />
                    <Scatter
                      name="Cluster 0"
                      data={cluster0Data}
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                    <Scatter
                      name="Noise"
                      data={noiseData}
                      fill="#ef4444"
                      fillOpacity={0.8}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 rounded bg-gradient-to-r from-green-300 to-green-600" />
                  <span>Posisi X = Kalori</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 rounded bg-gradient-to-r from-blue-300 to-blue-600" />
                  <span>Posisi Y = Protein</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <div className="h-4 w-4 rounded-full bg-gray-400" />
                  </div>
                  <span>Ukuran = Lemak</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ChartPie className="h-5 w-5 text-primary" />
                  Lihat Visualisasi
                </CardTitle>
                <CardDescription>
                  Eksplorasi detail hasil clustering
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Data Baru
                </CardTitle>
                <CardDescription>
                  Tambahkan data bahan pangan baru
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  Susun Menu MBG
                </CardTitle>
                <CardDescription>Buat menu bergizi seimbang</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
