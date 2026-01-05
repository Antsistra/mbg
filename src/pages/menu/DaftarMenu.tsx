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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UtensilsCrossed,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { getMenus, deleteMenu } from "@/services/menuService";
import type { Menu } from "@/types/database";
import {
  MEAL_TYPE_LABELS,
  TARGET_AUDIENCE_LABELS,
  MENU_STATUS_LABELS,
} from "@/types/database";

export default function DaftarMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadMenus() {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await getMenus(user.id);
        setMenus(data);
      } catch (error) {
        console.error("Failed to load menus:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenus();
  }, [user]);

  const handleDelete = async () => {
    if (!menuToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMenu(menuToDelete.id);
      setMenus((prev) => prev.filter((m) => m.id !== menuToDelete.id));
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    } catch (error) {
      console.error("Failed to delete menu:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "published":
        return "default";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

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
                  <BreadcrumbPage>Menu MBG</BreadcrumbPage>
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
                Daftar Menu MBG
              </h1>
              <p className="text-muted-foreground">
                Kelola menu makanan bergizi gratis
              </p>
            </div>
            <Button asChild>
              <Link to="/menu/susun">
                <Plus className="mr-2 h-4 w-4" />
                Susun Menu Baru
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Menu</CardDescription>
                <CardTitle className="text-3xl">{menus.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Menu Published</CardDescription>
                <CardTitle className="text-3xl">
                  {menus.filter((m) => m.status === "published").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Menu Draft</CardDescription>
                <CardTitle className="text-3xl">
                  {menus.filter((m) => m.status === "draft").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Menu List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : menus.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  Belum ada menu tersimpan
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Mulai susun menu MBG dengan bahan pangan yang aman dan bergizi
                </p>
                <Button asChild>
                  <Link to="/menu/susun">
                    <Plus className="mr-2 h-4 w-4" />
                    Susun Menu Pertama
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menus.map((menu) => (
                <Card
                  key={menu.id}
                  className="group hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="line-clamp-1">
                          {menu.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {menu.description || "Tidak ada deskripsi"}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/menu/lihat/${menu.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/menu/edit/${menu.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setMenuToDelete(menu);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusColor(menu.status)}>
                          {MENU_STATUS_LABELS[menu.status]}
                        </Badge>
                        <Badge variant="outline">
                          {MEAL_TYPE_LABELS[menu.meal_type]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {TARGET_AUDIENCE_LABELS[menu.target_audience]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UtensilsCrossed className="h-4 w-4" />
                          <span>{menu.serving_size} porsi</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Kalori
                          </p>
                          <p className="font-semibold text-sm">
                            {menu.total_calories?.toFixed(0) || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Protein
                          </p>
                          <p className="font-semibold text-sm">
                            {menu.total_proteins?.toFixed(0) || 0}g
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Lemak</p>
                          <p className="font-semibold text-sm">
                            {menu.total_fat?.toFixed(0) || 0}g
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Karbo</p>
                          <p className="font-semibold text-sm">
                            {menu.total_carbohydrate?.toFixed(0) || 0}g
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(menu.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Menu</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus menu "{menuToDelete?.name}"?
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
