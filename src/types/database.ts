// Types untuk database MBG

export interface FoodItem {
  id: number;
  name: string;
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
  image: string | null;
  cluster: "cluster_0" | "Noise";
  created_at: string;
}

export interface FoodItemWithStatus extends FoodItem {
  safety_status: "Aman" | "Tidak Aman" | "Unknown";
}

export interface Menu {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  meal_type: MealType;
  target_audience: TargetAudience;
  serving_size: number;
  total_calories: number;
  total_proteins: number;
  total_fat: number;
  total_carbohydrate: number;
  is_safe: boolean;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  food_item_id: number;
  quantity: number;
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
  notes: string | null;
  created_at: string;
}

export interface MenuItemWithFood extends MenuItem {
  food_item: FoodItem;
}

export interface MenuWithItems extends Menu {
  items: MenuItemWithFood[];
}

export interface NutritionStandard {
  id: number;
  target_audience: TargetAudience;
  meal_type: MealType;
  min_calories: number;
  max_calories: number;
  min_proteins: number;
  max_proteins: number;
  min_fat: number;
  max_fat: number;
  min_carbohydrate: number;
  max_carbohydrate: number;
  description: string | null;
}

export type MealType = "sarapan" | "makan_siang" | "makan_malam" | "snack";
export type TargetAudience = "sd" | "smp" | "sma";
export type MenuStatus = "draft" | "published" | "archived";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  sarapan: "Sarapan",
  makan_siang: "Makan Siang",
  makan_malam: "Makan Malam",
  snack: "Snack",
};

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  sd: "SD (7-12 tahun)",
  smp: "SMP (13-15 tahun)",
  sma: "SMA (16-18 tahun)",
};

export const MENU_STATUS_LABELS: Record<MenuStatus, string> = {
  draft: "Draft",
  published: "Dipublikasikan",
  archived: "Diarsipkan",
};

// For creating new menu
export interface CreateMenuInput {
  name: string;
  description?: string;
  meal_type: MealType;
  target_audience: TargetAudience;
  serving_size?: number;
}

// For adding item to menu
export interface AddMenuItemInput {
  menu_id: string;
  food_item_id: number;
  quantity: number;
  notes?: string;
}
