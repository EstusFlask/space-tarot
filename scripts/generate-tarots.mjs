import { mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'images', 'tarots');
const outputDir = path.join(repoRoot, 'src', 'generated', 'tarots');

const targetWidth = 900;
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

async function generateTarotWebps() {
  const pngFiles = await listFilesByExtension(sourceDir, '.png');

  if (pngFiles.length === 0) {
    throw new Error(`No PNG tarot images found in ${sourceDir}`);
  }

  await clearGeneratedWebps();

  for (const file of pngFiles) {
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, `${path.parse(file).name}.webp`);

    await sharp(inputPath)
      .rotate()
      .resize({ width: targetWidth })
      .webp({ quality: webpQuality, effort: webpEffort })
      .toFile(outputPath);
  }

  console.log(`Generated ${pngFiles.length} tarot webp files in ${path.relative(repoRoot, outputDir)}`);
}

generateTarotWebps().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
