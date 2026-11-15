import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { PET_SIZES } from "./domain/types";

const gallery = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/gallery" }),
  schema: ({ image }) =>
    z.object({
      file: image(),
      thumb: image(),
      petName: z.string().trim().min(1),
      breed: z.string().trim().min(1),
      size: z.enum(PET_SIZES),
      caption: z.string().trim().min(1),
      takenAt: z.iso.date(),
      tutorAuthorized: z.literal(true),
      order: z.number().int().positive().optional(),
    }),
});

export const collections = { gallery };
