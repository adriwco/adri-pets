import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const PHOTO_MAX_SIZE = 1600;
export const THUMB_MAX_SIZE = 480;
export const ACCEPTED_FORMATS = ["jpeg", "png", "webp", "heif", "avif", "tiff"];
export const SIZE_ANSWERS = { P: "PEQUENO", M: "MEDIO", G: "GRANDE", GG: "GIGANTE" } as const;

export type GallerySizeAnswer = (typeof SIZE_ANSWERS)[keyof typeof SIZE_ANSWERS];

export interface GalleryPhotoData {
  petName: string;
  breed: string;
  size: GallerySizeAnswer;
  caption: string;
  takenAt: string;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseSizeAnswer(answer: string): GallerySizeAnswer | null {
  const key = answer.trim().toUpperCase();
  return key in SIZE_ANSWERS ? SIZE_ANSWERS[key as keyof typeof SIZE_ANSWERS] : null;
}

export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
}

export async function isSupportedImage(filePath: string): Promise<boolean> {
  try {
    const { format } = await sharp(filePath).metadata();
    return ACCEPTED_FORMATS.includes(format);
  } catch {
    return false;
  }
}

export async function addGalleryPhoto(sourcePath: string, outputDir: string, slug: string, data: GalleryPhotoData) {
  await mkdir(outputDir, { recursive: true });
  const fileName = `${slug}.webp`;
  const thumbName = `${slug}-thumb.webp`;
  const oriented = sharp(sourcePath).rotate();
  await oriented
    .clone()
    .resize({ width: PHOTO_MAX_SIZE, height: PHOTO_MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outputDir, fileName));
  await oriented
    .clone()
    .resize({ width: THUMB_MAX_SIZE, height: THUMB_MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(outputDir, thumbName));
  const entry = { file: `./${fileName}`, thumb: `./${thumbName}`, ...data, tutorAuthorized: true };
  await writeFile(path.join(outputDir, `${slug}.json`), `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}
