import { getCollection } from "astro:content";
import { sortGallery } from "../domain/gallery";

export async function loadGallery() {
  const entries = await getCollection("gallery");
  return sortGallery(entries.map((entry) => ({ id: entry.id, ...entry.data })));
}
