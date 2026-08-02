import { mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'images', 'card_back');
const outputDir = path.join(repoRoot, 'src', 'generated', 'card_backs');

const webpQuality = 82;
const webpEffort = 5;

async function listFilesByExtension(dir, extension) {
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function clearGeneratedWebps() {
  await mkdir(outputDir, { recursive: true });

  const existingWebps = await listFilesByExtension(outputDir, '.webp');
  await Promise.all(existingWebps.map(file => unlink(path.join(outputDir, file))));
}

async function generateCardBackWebps() {
  const pngFiles = await listFilesByExtension(sourceDir, '.png');

  if (pngFiles.length === 0) {
    throw new Error(`No PNG card-back images found in ${sourceDir}`);
  }

  await clearGeneratedWebps();

  for (const file of pngFiles) {
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, `${path.parse(file).name}.webp`);

    await sharp(inputPath)
      .webp({ quality: webpQuality, effort: webpEffort })
      .toFile(outputPath);
  }

  console.log(`Generated ${pngFiles.length} card-back webp files in ${path.relative(repoRoot, outputDir)}`);
}

generateCardBackWebps().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
