import { supabase } from "@/lib/supabase";
import type {
  FoodItem,
  Menu,
  MenuWithItems,
  NutritionStandard,
  CreateMenuInput,
  AddMenuItemInput,
  MealType,
  TargetAudience,
} from "@/types/database";

// ============================================
// FOOD ITEMS
// ============================================

export async function getFoodItems(options?: {
  search?: string;
  cluster?: "cluster_0" | "Noise" | "all";
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from("food_items")
    .select("*")
    .order("name", { ascending: true });

  if (options?.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  if (options?.cluster && options.cluster !== "all") {
    query = query.eq("cluster", options.cluster);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as FoodItem[];
}

export async function getFoodItemById(id: number) {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as FoodItem;
}

export async function searchFoodItems(search: string, limit = 20) {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .ilike("name", `%${search}%`)
    .order("name")
    .limit(limit);

  if (error) throw error;
  return data as FoodItem[];
}

// ============================================
// MENUS
// ============================================

export async function getMenus(userId?: string) {
  let query = supabase
    .from("menus")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Menu[];
}

export async function getMenuById(id: string) {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Menu;
}

export async function getMenuWithItems(id: string): Promise<MenuWithItems> {
  // Get menu
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  if (menuError) throw menuError;

  // Get menu items with food details
  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select(`
      *,
      food_item:food_items(*)
    `)
    .eq("menu_id", id);

  if (itemsError) throw itemsError;

  return {
    ...menu,
    items: items || [],
  } as MenuWithItems;
}

export async function createMenu(input: CreateMenuInput, userId: string) {
  const { data, error } = await supabase
    .from("menus")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      meal_type: input.meal_type,
      target_audience: input.target_audience,
      serving_size: input.serving_size || 1,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Menu;
}

export async function updateMenu(id: string, updates: Partial<Menu>) {
  const { data, error } = await supabase
    .from("menus")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Menu;
}

export async function deleteMenu(id: string) {
  const { error } = await supabase.from("menus").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// MENU ITEMS
// ============================================

export async function addMenuItem(input: AddMenuItemInput) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      menu_id: input.menu_id,
      food_item_id: input.food_item_id,
      quantity: input.quantity,
      notes: input.notes || null,
    })
    .select(`
      *,
      food_item:food_items(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMenuItem(
  id: string,
  updates: { quantity?: number; notes?: string }
) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      food_item:food_items(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function removeMenuItem(id: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) throw error;
}

// ============================================
// NUTRITION STANDARDS
// ============================================

export async function getNutritionStandard(
  targetAudience: TargetAudience,
  mealType: MealType
) {
  const { data, error } = await supabase
    .from("nutrition_standards")
    .select("*")
    .eq("target_audience", targetAudience)
    .eq("meal_type", mealType)
    .single();

  if (error) throw error;
  return data as NutritionStandard;
}

export async function getAllNutritionStandards() {
  const { data, error } = await supabase
    .from("nutrition_standards")
    .select("*")
    .order("target_audience")
    .order("meal_type");

  if (error) throw error;
  return data as NutritionStandard[];
}

export async function updateNutritionStandard(
  id: number,
  updates: {
    min_calories?: number;
    max_calories?: number;
    min_proteins?: number;
    max_proteins?: number;
    min_fat?: number;
    max_fat?: number;
    min_carbohydrate?: number;
    max_carbohydrate?: number;
    description?: string;
  }
) {
  const { data, error } = await supabase
    .from("nutrition_standards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as NutritionStandard;
}

export async function createNutritionStandard(input: {
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
  description?: string;
}) {
  const { data, error } = await supabase
    .from("nutrition_standards")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as NutritionStandard;
}
