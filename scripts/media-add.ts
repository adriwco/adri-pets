import { existsSync } from "node:fs";
import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { addGalleryPhoto, isIsoDate, isSupportedImage, parseSizeAnswer, slugify } from "./media/galleryPhoto.ts";
import { findFilesWithMetadata } from "./media/findFilesWithMetadata.ts";
import { MIXED_BREED } from "../src/domain/gallery.ts";

const INBOX_DIR = "media-inbox";
const ADDED_DIR = path.join(INBOX_DIR, "adicionadas");
const GALLERY_DIR = "src/content/gallery";

const reader = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question: string, fallback = ""): Promise<string> {
  const suffix = fallback ? ` [${fallback}]` : "";
  const answer = (await reader.question(`${question}${suffix}: `)).trim();
  return answer || fallback;
}

async function askUntilValid<T>(question: string, parse: (answer: string) => T | null, fallback = ""): Promise<T> {
  for (;;) {
    const parsed = parse(await ask(question, fallback));
    if (parsed !== null) {
      return parsed;
    }
    console.log("Resposta inválida, tente de novo.");
  }
}

function uniqueSlug(base: string): string {
  let slug = base;
  for (let counter = 2; existsSync(path.join(GALLERY_DIR, `${slug}.json`)); counter += 1) {
    slug = `${base}-${counter}`;
  }
  return slug;
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
const names = (await readdir(INBOX_DIR, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
let added = 0;

for (const name of names.sort()) {
  const sourcePath = path.join(INBOX_DIR, name);
  if (!(await isSupportedImage(sourcePath))) {
    console.log(`Ignorado (não é imagem): ${name}`);
    continue;
  }
  console.log(`\nFoto: ${name}`);
  const authorized = await askUntilValid("O tutor autorizou publicar? (s/n)", (answer) =>
    /^[sn]$/i.test(answer) ? answer.toLowerCase() === "s" : null,
  );
  if (!authorized) {
    console.log("Pulada.");
    continue;
  }
  const petName = await askUntilValid("Nome do pet", (answer) => answer || null, path.parse(name).name);
  const breed = await askUntilValid("Raça", (answer) => answer || null, MIXED_BREED);
  const size = await askUntilValid("Porte (P, M, G ou GG)", parseSizeAnswer);
  const caption = await askUntilValid("Legenda curta", (answer) => answer || null);
  const takenAt = await askUntilValid("Data da foto (AAAA-MM-DD)", (answer) => (isIsoDate(answer) ? answer : null), today);
  const slug = uniqueSlug(slugify(petName));
  await addGalleryPhoto(sourcePath, GALLERY_DIR, slug, { petName, breed, size, caption, takenAt });
  await mkdir(ADDED_DIR, { recursive: true });
  await rename(sourcePath, path.join(ADDED_DIR, name));
  added += 1;
  console.log(`Adicionada: ${GALLERY_DIR}/${slug}.webp`);
}

reader.close();

const flagged = await findFilesWithMetadata(GALLERY_DIR);
if (flagged.length > 0) {
  console.error(`Fotos com metadados: ${flagged.join(", ")}`);
  process.exit(1);
}
console.log(`\n${added} foto(s) adicionada(s). Confira, faça commit e push.`);
