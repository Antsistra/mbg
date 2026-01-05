// Script untuk generate SQL INSERT dari CSV files
// Jalankan: npx tsx database/generate-seed.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CSV dengan handling quotes
function parseCSV(csvString: string): Record<string, string | number>[] {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, '') || '';
      obj[header] = isNaN(Number(value)) ? value : Number(value);
    });
    return obj;
  });
}

// Escape single quotes for SQL
function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

// Main function
async function generateSeed() {
  const clusteringPath = path.join(__dirname, '../src/constants/hasil-clustering.csv');
  const nutritionPath = path.join(__dirname, '../src/constants/nutrition.csv');
  const outputPath = path.join(__dirname, 'seed-full.sql');

  // Read files
  const clusteringRaw = fs.readFileSync(clusteringPath, 'utf-8');
  const nutritionRaw = fs.readFileSync(nutritionPath, 'utf-8');

  // Parse CSV
  const clusteringData = parseCSV(clusteringRaw);
  const nutritionData = parseCSV(nutritionRaw);

  // Create nutrition map
  const nutritionMap = new Map<string, Record<string, string | number>>();
  nutritionData.forEach(item => {
    const name = String(item.name).toLowerCase().trim();
    nutritionMap.set(name, item);
  });

  // Merge data
  const mergedData: Array<{
    name: string;
    calories: number;
    proteins: number;
    fat: number;
    carbohydrate: number;
    cluster: string;
    image?: string;
  }> = [];

  clusteringData.forEach(clusterItem => {
    const name = String(clusterItem.name);
    const normalizedName = name.toLowerCase().trim();
    
    let nutritionItem = nutritionMap.get(normalizedName);
    
    // Try partial match if exact match fails
    if (!nutritionItem) {
      for (const [key, value] of nutritionMap.entries()) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          nutritionItem = value;
          break;
        }
      }
    }

    if (nutritionItem) {
      mergedData.push({
        name: name,
        calories: Number(nutritionItem.calories) || 0,
        proteins: Number(nutritionItem.proteins) || 0,
        fat: Number(nutritionItem.fat) || 0,
        carbohydrate: Number(nutritionItem.carbohydrate) || 0,
        cluster: String(clusterItem.cluster),
        image: nutritionItem.image ? String(nutritionItem.image) : undefined,
      });
    } else {
      // Fallback - use clustering data (normalized values, not ideal)
      console.warn(`No match found for: ${name}`);
    }
  });

  // Generate SQL
  let sql = `-- ============================================
-- SEED DATA: Food Items dari CSV
-- Generated: ${new Date().toISOString()}
-- Total: ${mergedData.length} items
-- ============================================

-- Clear existing data
TRUNCATE TABLE food_items RESTART IDENTITY CASCADE;

-- Insert all food items
INSERT INTO food_items (name, calories, proteins, fat, carbohydrate, cluster, image) VALUES
`;

  const values = mergedData.map((item, index) => {
    const comma = index < mergedData.length - 1 ? ',' : ';';
    const image = item.image ? `'${escapeSQL(item.image)}'` : 'NULL';
    return `    ('${escapeSQL(item.name)}', ${item.calories}, ${item.proteins}, ${item.fat}, ${item.carbohydrate}, '${item.cluster}', ${image})${comma}`;
  });

  sql += values.join('\n');

  sql += `

-- ============================================
-- VERIFIKASI
-- ============================================

SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE cluster = 'cluster_0') as aman,
    COUNT(*) FILTER (WHERE cluster = 'Noise') as tidak_aman
FROM food_items;

SELECT * FROM food_items_with_status LIMIT 20;
`;

  // Write to file
  fs.writeFileSync(outputPath, sql);
  
  console.log(`✅ Generated seed file: ${outputPath}`);
  console.log(`   Total items: ${mergedData.length}`);
  console.log(`   Aman: ${mergedData.filter(d => d.cluster === 'cluster_0').length}`);
  console.log(`   Tidak Aman: ${mergedData.filter(d => d.cluster === 'Noise').length}`);
}

generateSeed().catch(console.error);
