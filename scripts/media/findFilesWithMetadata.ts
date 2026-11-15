import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif", ".tif", ".tiff", ".heic"]);

export async function findFilesWithMetadata(directory: string): Promise<string[]> {
  const names = await readdir(directory).catch(() => []);
  const images = names.filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase())).sort();
  const flagged: string[] = [];
  for (const name of images) {
    const metadata = await sharp(path.join(directory, name)).metadata();
    if (metadata.exif || metadata.xmp || metadata.iptc || metadata.icc) {
      flagged.push(name);
    }
  }
  return flagged;
}
