import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { nextClassSchema } from "./lib/next-class";

const aulas = defineCollection({
  loader: glob({ pattern: "proxima-aula.json", base: "./src/data" }),
  schema: nextClassSchema,
});

export const collections = { aulas };
