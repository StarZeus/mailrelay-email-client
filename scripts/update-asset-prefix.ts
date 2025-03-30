import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env file if it exists, but don't fail if it doesn't
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Get asset prefix from environment variable
const ASSET_PREFIX = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';

const NEXT_DIR = path.join(__dirname, '..', '.next');
const STANDALONE_DIR = path.join(NEXT_DIR, 'standalone');
const SERVER_JS_PATH = path.join(STANDALONE_DIR, 'server.js');

function updateAssetPrefixInFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Replace the dynamic asset prefix placeholder
    content = content.replace(/\/__DYNAMIC_ASSET_PREFIX__/g, ASSET_PREFIX);
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated asset prefix in: ${path.relative(NEXT_DIR, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error updating file ${filePath}:`, error);
  }
}

function walkDirectory(dir: string): void {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (stat.isFile()) {
      // Only process text files
      if (['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css','.rsc','.meta','.env'].includes(path.extname(file)) || file === 'trace') {
        updateAssetPrefixInFile(filePath);
      }
    }
  }
}

function updateServerJs(): void {
  try {
    if (!fs.existsSync(SERVER_JS_PATH)) {
      console.error('❌ server.js not found in standalone build. Please run build first.');
      process.exit(1);
    }

    let content = fs.readFileSync(SERVER_JS_PATH, 'utf-8');
    
    // Add asset prefix configuration before the server starts
    const serverConfig = `
const nextConfig = {
  assetPrefix: '${ASSET_PREFIX}',
  ...require('./.next/server/pages-manifest.json')
};
`;

    // Insert the config before the server starts
    content = content.replace(
      /const nextConfig = require\('\.\/\.next\/server\/pages-manifest\.json'\);/,
      serverConfig
    );

    fs.writeFileSync(SERVER_JS_PATH, content);
    console.log(`✅ Updated server.js with asset prefix: ${SERVER_JS_PATH}`);
  } catch (error) {
    console.error('❌ Error updating server.js:', error);
    process.exit(1);
  }
}

function main() {
  if (!fs.existsSync(NEXT_DIR)) {
    console.error('❌ .next directory not found. Please run build first.');
    process.exit(1);
  }

  console.log(`✨ Starting asset prefix update with: ${ASSET_PREFIX}`);
  
  // Update server.js first
  updateServerJs();
  
  // Then walk through all files in .next directory
  walkDirectory(NEXT_DIR);
  
  console.log('✅ Asset prefix update completed');
}

main(); 