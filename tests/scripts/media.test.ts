import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findFilesWithMetadata } from "../../scripts/media/findFilesWithMetadata";
import {
  addGalleryPhoto,
  isIsoDate,
  isSupportedImage,
  parseSizeAnswer,
  PHOTO_MAX_SIZE,
  slugify,
  THUMB_MAX_SIZE,
} from "../../scripts/media/galleryPhoto";

let directory = "";

function solidImage(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#c2531f" } });
}

async function writePhotoWithGps(filePath: string, width = 200, height = 100) {
  await solidImage(width, height)
    .jpeg()
    .withExif({ IFD0: { Make: "Celular" }, IFD3: { GPSLatitudeRef: "S", GPSLatitude: "3/1 43/1 0/1" } })
    .toFile(filePath);
}

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "galeria-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("findFilesWithMetadata", () => {
  it("aponta a foto que tem GPS", async () => {
    await writePhotoWithGps(path.join(directory, "com-gps.jpg"));
    await expect(findFilesWithMetadata(directory)).resolves.toEqual(["com-gps.jpg"]);
  });

  it("aceita a foto sem metadados", async () => {
    await solidImage(200, 100).webp().toFile(path.join(directory, "limpa.webp"));
    await expect(findFilesWithMetadata(directory)).resolves.toEqual([]);
  });

  it("ignora arquivos que não são imagem e pastas inexistentes", async () => {
    await writeFile(path.join(directory, "dados.json"), "{}");
    await expect(findFilesWithMetadata(directory)).resolves.toEqual([]);
    await expect(findFilesWithMetadata(path.join(directory, "nao-existe"))).resolves.toEqual([]);
  });
});

describe("addGalleryPhoto", () => {
  it("gera a foto e a miniatura em WebP, sem metadados e no tamanho máximo", async () => {
    const source = path.join(directory, "original.jpg");
    await writePhotoWithGps(source, 3000, 4000);
    const output = path.join(directory, "galeria");
    const data = { petName: "Thor", breed: "Dálmata", size: "GRANDE" as const, caption: "No quintal", takenAt: "2026-06-27" };

    await addGalleryPhoto(source, output, "thor", data);

    const photo = await sharp(path.join(output, "thor.webp")).metadata();
    const thumb = await sharp(path.join(output, "thor-thumb.webp")).metadata();
    expect([photo.format, photo.width, photo.height]).toEqual(["webp", PHOTO_MAX_SIZE * 0.75, PHOTO_MAX_SIZE]);
    expect([thumb.format, thumb.width, thumb.height]).toEqual(["webp", THUMB_MAX_SIZE * 0.75, THUMB_MAX_SIZE]);
    await expect(findFilesWithMetadata(output)).resolves.toEqual([]);
    expect(JSON.parse(await readFile(path.join(output, "thor.json"), "utf8"))).toEqual({
      file: "./thor.webp",
      thumb: "./thor-thumb.webp",
      ...data,
      tutorAuthorized: true,
    });
  });

  it("não aumenta foto pequena", async () => {
    const source = path.join(directory, "pequena.png");
    await solidImage(300, 200).png().toFile(source);
    await addGalleryPhoto(source, directory, "pequena", {
      petName: "Maya",
      breed: "SRD",
      size: "PEQUENO",
      caption: "Filhote",
      takenAt: "2026-01-01",
    });
    const photo = await sharp(path.join(directory, "pequena.webp")).metadata();
    expect([photo.width, photo.height]).toEqual([300, 200]);
  });
});

describe("isSupportedImage", () => {
  it("recusa arquivo que não é imagem", async () => {
    const text = path.join(directory, "nota.txt");
    await writeFile(text, "não sou foto");
    const photo = path.join(directory, "foto.jpg");
    await solidImage(10, 10).jpeg().toFile(photo);
    await expect(isSupportedImage(text)).resolves.toBe(false);
    await expect(isSupportedImage(photo)).resolves.toBe(true);
  });
});

describe("respostas do media:add", () => {
  it("converte a sigla do porte", () => {
    expect(["p", "M", " g ", "GG", "XG"].map(parseSizeAnswer)).toEqual(["PEQUENO", "MEDIO", "GRANDE", "GIGANTE", null]);
  });

  it("valida a data no formato AAAA-MM-DD", () => {
    expect(["2026-06-27", "2026-02-30", "27/06/2026", ""].map(isIsoDate)).toEqual([true, false, false, false]);
  });

  it("gera o nome do arquivo sem acento nem espaço", () => {
    expect(slugify("Chico e Jujú!")).toBe("chico-e-juju");
  });
});
