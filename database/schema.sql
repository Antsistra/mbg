-- ============================================
-- DATABASE SCHEMA: Makan Bergizi Gratis (MBG)
-- ============================================
-- Jalankan query ini di Supabase SQL Editor
-- RLS dimatikan untuk keperluan tugas kampus

-- ============================================
-- 1. TABEL BAHAN PANGAN (food_items)
-- ============================================
-- Menyimpan data nutrisi bahan pangan

CREATE TABLE IF NOT EXISTS food_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    calories DECIMAL(10, 2) DEFAULT 0, -- kkal per 100g
    proteins DECIMAL(10, 2) DEFAULT 0, -- gram per 100g
    fat DECIMAL(10, 2) DEFAULT 0, -- gram per 100g
    carbohydrate DECIMAL(10, 2) DEFAULT 0, -- gram per 100g
    image TEXT, -- URL gambar
    cluster VARCHAR(50) DEFAULT 'cluster_0', -- cluster_0 = Aman, Noise = Tidak Aman
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items (name);

CREATE INDEX IF NOT EXISTS idx_food_items_cluster ON food_items (cluster);

-- Disable RLS
ALTER TABLE food_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. TABEL MENU (menus)
-- ============================================
-- Menyimpan menu yang disusun user

CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meal_type VARCHAR(50) NOT NULL,           -- 'sarapan', 'makan_siang', 'makan_malam', 'snack'
    target_audience VARCHAR(100),              -- 'sd', 'smp', 'sma', 'umum'
    serving_size INTEGER DEFAULT 1,            -- Jumlah porsi

-- Total nutrisi (akan dihitung otomatis via trigger atau aplikasi)
total_calories DECIMAL(10, 2) DEFAULT 0,
total_proteins DECIMAL(10, 2) DEFAULT 0,
total_fat DECIMAL(10, 2) DEFAULT 0,
total_carbohydrate DECIMAL(10, 2) DEFAULT 0,

-- Status menu
is_safe BOOLEAN DEFAULT TRUE,              -- Apakah semua bahan aman
    status VARCHAR(50) DEFAULT 'draft',        -- 'draft', 'published', 'archived'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON menus (user_id);

CREATE INDEX IF NOT EXISTS idx_menus_meal_type ON menus (meal_type);

CREATE INDEX IF NOT EXISTS idx_menus_status ON menus (status);

-- Disable RLS
ALTER TABLE menus DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. TABEL ITEM MENU (menu_items)
-- ============================================
-- Relasi many-to-many antara menu dan bahan pangan

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
    food_item_id INTEGER REFERENCES food_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) DEFAULT 100,       -- gram

-- Nutrisi per item (dihitung berdasarkan quantity)
calories DECIMAL(10, 2) DEFAULT 0,
    proteins DECIMAL(10, 2) DEFAULT 0,
    fat DECIMAL(10, 2) DEFAULT 0,
    carbohydrate DECIMAL(10, 2) DEFAULT 0,
    
    notes TEXT,                                -- Catatan tambahan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(menu_id, food_item_id)              -- Satu bahan hanya sekali per menu
);

-- Index
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items (menu_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_food_item_id ON menu_items (food_item_id);

-- Disable RLS
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. TABEL STANDAR GIZI (nutrition_standards)
-- ============================================
-- Standar kebutuhan gizi per target audience

CREATE TABLE IF NOT EXISTS nutrition_standards (
    id SERIAL PRIMARY KEY,
    target_audience VARCHAR(100) NOT NULL,     -- 'sd', 'smp', 'sma', 'umum'
    meal_type VARCHAR(50) NOT NULL,            -- 'sarapan', 'makan_siang', 'makan_malam', 'snack'

-- Kebutuhan gizi minimum
min_calories DECIMAL(10, 2) DEFAULT 0,
min_proteins DECIMAL(10, 2) DEFAULT 0,
min_fat DECIMAL(10, 2) DEFAULT 0,
min_carbohydrate DECIMAL(10, 2) DEFAULT 0,

-- Kebutuhan gizi maksimum
max_calories DECIMAL(10, 2) DEFAULT 0,
    max_proteins DECIMAL(10, 2) DEFAULT 0,
    max_fat DECIMAL(10, 2) DEFAULT 0,
    max_carbohydrate DECIMAL(10, 2) DEFAULT 0,
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(target_audience, meal_type)
);

-- Disable RLS
ALTER TABLE nutrition_standards DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. TABEL MENU TEMPLATES (menu_templates)
-- ============================================
-- Template menu yang sudah jadi untuk referensi

CREATE TABLE IF NOT EXISTS menu_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meal_type VARCHAR(50) NOT NULL,
    target_audience VARCHAR(100),

-- Copy dari menu yang sudah ada
source_menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    
    total_calories DECIMAL(10, 2) DEFAULT 0,
    total_proteins DECIMAL(10, 2) DEFAULT 0,
    total_fat DECIMAL(10, 2) DEFAULT 0,
    total_carbohydrate DECIMAL(10, 2) DEFAULT 0,
    
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE menu_templates DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. FUNCTION: Hitung Nutrisi Menu Item
-- ============================================
-- Menghitung nutrisi berdasarkan quantity

CREATE OR REPLACE FUNCTION calculate_menu_item_nutrition()
RETURNS TRIGGER AS $$
BEGIN
    SELECT 
        (f.calories * NEW.quantity / 100),
        (f.proteins * NEW.quantity / 100),
        (f.fat * NEW.quantity / 100),
        (f.carbohydrate * NEW.quantity / 100)
    INTO 
        NEW.calories,
        NEW.proteins,
        NEW.fat,
        NEW.carbohydrate
    FROM food_items f
    WHERE f.id = NEW.food_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk insert/update menu_items
DROP TRIGGER IF EXISTS trigger_calculate_menu_item_nutrition ON menu_items;

CREATE TRIGGER trigger_calculate_menu_item_nutrition
    BEFORE INSERT OR UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_menu_item_nutrition();

-- ============================================
-- 7. FUNCTION: Update Total Nutrisi Menu
-- ============================================
-- Menghitung total nutrisi dan cek keamanan menu

CREATE OR REPLACE FUNCTION update_menu_totals()
RETURNS TRIGGER AS $$
DECLARE
    menu_id_to_update UUID;
    has_unsafe_item BOOLEAN;
BEGIN
    -- Tentukan menu_id yang perlu diupdate
    IF TG_OP = 'DELETE' THEN
        menu_id_to_update := OLD.menu_id;
    ELSE
        menu_id_to_update := NEW.menu_id;
    END IF;
    
    -- Update total nutrisi
    UPDATE menus m
    SET 
        total_calories = COALESCE((
            SELECT SUM(mi.calories) FROM menu_items mi WHERE mi.menu_id = m.id
        ), 0),
        total_proteins = COALESCE((
            SELECT SUM(mi.proteins) FROM menu_items mi WHERE mi.menu_id = m.id
        ), 0),
        total_fat = COALESCE((
            SELECT SUM(mi.fat) FROM menu_items mi WHERE mi.menu_id = m.id
        ), 0),
        total_carbohydrate = COALESCE((
            SELECT SUM(mi.carbohydrate) FROM menu_items mi WHERE mi.menu_id = m.id
        ), 0),
        updated_at = NOW()
    WHERE m.id = menu_id_to_update;
    
    -- Cek apakah ada bahan tidak aman
    SELECT EXISTS (
        SELECT 1 
        FROM menu_items mi
        JOIN food_items f ON f.id = mi.food_item_id
        WHERE mi.menu_id = menu_id_to_update
        AND f.cluster = 'Noise'
    ) INTO has_unsafe_item;
    
    UPDATE menus
    SET is_safe = NOT has_unsafe_item
    WHERE id = menu_id_to_update;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk update total setelah perubahan menu_items
DROP TRIGGER IF EXISTS trigger_update_menu_totals ON menu_items;

CREATE TRIGGER trigger_update_menu_totals
    AFTER INSERT OR UPDATE OR DELETE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_totals();

-- ============================================
-- 8. INSERT DATA STANDAR GIZI MBG
-- ============================================
-- Berdasarkan standar gizi Program MBG

INSERT INTO
    nutrition_standards (
        target_audience,
        meal_type,
        min_calories,
        max_calories,
        min_proteins,
        max_proteins,
        min_fat,
        max_fat,
        min_carbohydrate,
        max_carbohydrate,
        description
    )
VALUES
    -- SD (7-12 tahun) - sekitar 30% kebutuhan harian per makan
    (
        'sd',
        'sarapan',
        300,
        450,
        8,
        15,
        8,
        15,
        40,
        65,
        'Standar gizi sarapan untuk anak SD'
    ),
    (
        'sd',
        'makan_siang',
        400,
        550,
        12,
        20,
        10,
        18,
        55,
        80,
        'Standar gizi makan siang untuk anak SD'
    ),
    (
        'sd',
        'makan_malam',
        350,
        500,
        10,
        18,
        9,
        16,
        45,
        70,
        'Standar gizi makan malam untuk anak SD'
    ),
    (
        'sd',
        'snack',
        100,
        200,
        3,
        6,
        3,
        8,
        15,
        30,
        'Standar gizi snack untuk anak SD'
    ),

-- SMP (13-15 tahun)
(
    'smp',
    'sarapan',
    400,
    550,
    12,
    20,
    10,
    18,
    55,
    80,
    'Standar gizi sarapan untuk anak SMP'
),
(
    'smp',
    'makan_siang',
    500,
    700,
    15,
    25,
    13,
    23,
    70,
    100,
    'Standar gizi makan siang untuk anak SMP'
),
(
    'smp',
    'makan_malam',
    450,
    600,
    13,
    22,
    12,
    20,
    60,
    85,
    'Standar gizi makan malam untuk anak SMP'
),
(
    'smp',
    'snack',
    150,
    250,
    4,
    8,
    4,
    10,
    20,
    40,
    'Standar gizi snack untuk anak SMP'
),

-- SMA (16-18 tahun)
(
    'sma',
    'sarapan',
    450,
    600,
    15,
    22,
    12,
    20,
    60,
    85,
    'Standar gizi sarapan untuk anak SMA'
),
(
    'sma',
    'makan_siang',
    550,
    750,
    18,
    28,
    15,
    25,
    75,
    110,
    'Standar gizi makan siang untuk anak SMA'
),
(
    'sma',
    'makan_malam',
    500,
    650,
    15,
    25,
    13,
    22,
    65,
    95,
    'Standar gizi makan malam untuk anak SMA'
),
(
    'sma',
    'snack',
    150,
    300,
    5,
    10,
    5,
    12,
    25,
    45,
    'Standar gizi snack untuk anak SMA'
),

-- Umum (dewasa)
(
    'umum',
    'sarapan',
    400,
    600,
    12,
    20,
    10,
    20,
    50,
    80,
    'Standar gizi sarapan untuk umum'
),
(
    'umum',
    'makan_siang',
    500,
    700,
    15,
    25,
    13,
    23,
    65,
    95,
    'Standar gizi makan siang untuk umum'
),
(
    'umum',
    'makan_malam',
    450,
    650,
    13,
    22,
    12,
    20,
    55,
    85,
    'Standar gizi makan malam untuk umum'
),
(
    'umum',
    'snack',
    150,
    250,
    4,
    8,
    4,
    10,
    20,
    35,
    'Standar gizi snack untuk umum'
) ON CONFLICT (target_audience, meal_type) DO NOTHING;

-- ============================================
-- 9. VIEW: Menu dengan Detail Lengkap
-- ============================================

CREATE OR REPLACE VIEW menu_details AS
SELECT
    m.id,
    m.name,
    m.description,
    m.meal_type,
    m.target_audience,
    m.serving_size,
    m.total_calories,
    m.total_proteins,
    m.total_fat,
    m.total_carbohydrate,
    m.is_safe,
    m.status,
    m.created_at,
    m.updated_at,
    COUNT(mi.id) as item_count,
    COALESCE(
        json_agg (
            json_build_object (
                'id',
                mi.id,
                'food_item_id',
                f.id,
                'name',
                f.name,
                'quantity',
                mi.quantity,
                'calories',
                mi.calories,
                'proteins',
                mi.proteins,
                'fat',
                mi.fat,
                'carbohydrate',
                mi.carbohydrate,
                'cluster',
                f.cluster,
                'image',
                f.image
            )
        ) FILTER (
            WHERE
                mi.id IS NOT NULL
        ),
        '[]'
    ) as items
FROM
    menus m
    LEFT JOIN menu_items mi ON mi.menu_id = m.id
    LEFT JOIN food_items f ON f.id = mi.food_item_id
GROUP BY
    m.id;

-- ============================================
-- 10. VIEW: Food Items dengan Status Keamanan
-- ============================================

CREATE OR REPLACE VIEW food_items_with_status AS
SELECT
    id,
    name,
    calories,
    proteins,
    fat,
    carbohydrate,
    image,
    cluster,
    CASE
        WHEN cluster = 'cluster_0' THEN 'Aman'
        WHEN cluster = 'Noise' THEN 'Tidak Aman'
        ELSE 'Unknown'
    END as safety_status,
    created_at
FROM food_items
ORDER BY name;

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek tabel yang sudah dibuat

SELECT table_name
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;