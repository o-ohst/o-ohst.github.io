import sharp from "sharp";
import { readdir } from "node:fs/promises";
// Keep source screenshots intact; serve a suitable WebP rendition to each screen.
for (const name of await readdir("public/projects")) {
  if (!name.endsWith(".jpg")) continue;
  for (const width of [640, 1100]) {
    await sharp(`public/projects/${name}`)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(`public/projects/${name.replace(".jpg", "")}-${width}.webp`);
  }
}
console.log("Created responsive WebP project plates.");
