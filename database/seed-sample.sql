-- ============================================
-- IMPORT DATA BAHAN PANGAN KE DATABASE
-- ============================================
-- Jalankan setelah schema.sql

-- Karena kita punya data di CSV, kita perlu import manual
-- Berikut adalah contoh format INSERT untuk beberapa data

-- Cara 1: Import via Supabase Dashboard
-- 1. Buka Table Editor > food_items
-- 2. Klik "Insert" > "Import data from CSV"
-- 3. Upload file nutrition.csv yang sudah digabung dengan cluster

-- Cara 2: Gunakan query INSERT (contoh beberapa data)
-- Hapus data lama jika ada
-- TRUNCATE TABLE food_items RESTART IDENTITY CASCADE;

-- Contoh insert data (ini hanya sample, data lengkap dari CSV)
INSERT INTO
    food_items (
        name,
        calories,
        proteins,
        fat,
        carbohydrate,
        cluster
    )
VALUES (
        'Nasi putih',
        180,
        3.0,
        0.3,
        39.8,
        'cluster_0'
    ),
    (
        'Telur ayam',
        154,
        12.4,
        10.8,
        1.2,
        'cluster_0'
    ),
    (
        'Tempe goreng',
        192,
        14.0,
        13.4,
        6.8,
        'cluster_0'
    ),
    (
        'Tahu goreng',
        78,
        5.6,
        5.5,
        1.7,
        'cluster_0'
    ),
    (
        'Ayam goreng',
        260,
        27.0,
        14.0,
        4.0,
        'cluster_0'
    ),
    (
        'Ikan mas goreng',
        132,
        16.0,
        7.0,
        0.3,
        'cluster_0'
    ),
    (
        'Sayur bayam',
        36,
        3.5,
        0.5,
        6.5,
        'cluster_0'
    ),
    (
        'Sayur kangkung',
        29,
        3.0,
        0.3,
        5.4,
        'cluster_0'
    ),
    (
        'Wortel',
        42,
        0.9,
        0.2,
        9.6,
        'cluster_0'
    ),
    (
        'Kentang rebus',
        87,
        2.0,
        0.1,
        20.0,
        'cluster_0'
    ),
    (
        'Pisang ambon',
        99,
        1.2,
        0.2,
        25.8,
        'cluster_0'
    ),
    (
        'Apel',
        58,
        0.3,
        0.4,
        14.9,
        'cluster_0'
    ),
    (
        'Jeruk',
        45,
        0.9,
        0.2,
        11.2,
        'cluster_0'
    ),
    (
        'Susu sapi',
        61,
        3.2,
        3.5,
        4.8,
        'cluster_0'
    ),
    (
        'Keju cheddar',
        402,
        25.0,
        33.0,
        1.3,
        'Noise'
    ),
    (
        'Mentega',
        717,
        0.9,
        81.0,
        0.1,
        'Noise'
    ),
    (
        'Minyak goreng',
        884,
        0.0,
        100.0,
        0.0,
        'Noise'
    ),
    (
        'Gula pasir',
        387,
        0.0,
        0.0,
        100.0,
        'Noise'
    ),
    (
        'Mie instan',
        457,
        8.5,
        20.0,
        61.0,
        'Noise'
    ),
    (
        'Sosis',
        315,
        11.0,
        28.0,
        3.0,
        'Noise'
    ) ON CONFLICT (name) DO
UPDATE
SET
    calories = EXCLUDED.calories,
    proteins = EXCLUDED.proteins,
    fat = EXCLUDED.fat,
    carbohydrate = EXCLUDED.carbohydrate,
    cluster = EXCLUDED.cluster;

-- ============================================
-- VERIFIKASI DATA
-- ============================================

-- Cek jumlah data
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (
        WHERE
            cluster = 'cluster_0'
    ) as aman,
    COUNT(*) FILTER (
        WHERE
            cluster = 'Noise'
    ) as tidak_aman
FROM food_items;

-- Cek sample data
SELECT * FROM food_items_with_status LIMIT 10;