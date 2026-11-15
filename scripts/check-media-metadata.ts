import { findFilesWithMetadata } from "./media/findFilesWithMetadata.ts";

const GALLERY_DIR = "src/content/gallery";

const flagged = await findFilesWithMetadata(GALLERY_DIR);
if (flagged.length > 0) {
  console.error(`Fotos com metadados (podem conter GPS) em ${GALLERY_DIR}:`);
  for (const name of flagged) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}
console.log(`Nenhum metadado encontrado em ${GALLERY_DIR}.`);
