import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = path.join(root, "public", "brand");
const appDir = path.join(root, "app");
const original = await readFile(path.join(brandDir, "socra-logo.svg"), "utf8");
const symbolGroup = original.match(/<g\b[^>]*>([\s\S]*?)<\/g>/)?.[1];
if (!symbolGroup) throw new Error("Il logo originale non contiene il gruppo del simbolo.");

// Coordinates of the original paths before the full logo's scale/translation.
// Cropping changes only the viewport: the paths remain exactly as supplied.
const symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="34 14 52 92" width="52" height="92">${symbolGroup}</svg>\n`;
const onDark = (svg) => svg.replaceAll("#20272E", "#FFFFFF");
const square = (size, content, background = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}">${background}<svg x="38" y="18" width="52" height="92" viewBox="34 14 52 92">${content}</svg></svg>`;

await writeFile(path.join(brandDir, "socra-logo-light.svg"), onDark(original));
await writeFile(path.join(brandDir, "socra-symbol.svg"), symbol);
await writeFile(path.join(brandDir, "socra-symbol-light.svg"), onDark(symbol));

// Browser tabs adapt to the browser's color scheme; site logos use an explicit variant.
const adaptiveSymbol = symbolGroup.replaceAll('fill="#20272E"', 'class="ink" fill="#20272E"');
const favicon = square(128, adaptiveSymbol).replace(
  "><svg",
  "><style>@media(prefers-color-scheme:dark){.ink{fill:#fff}}</style><svg",
);
await writeFile(path.join(appDir, "icon.svg"), `${favicon}\n`);
const monitoringDir = path.join(root, "public", "monitoring");
await mkdir(monitoringDir, { recursive: true });
await writeFile(path.join(monitoringDir, "favicon.svg"), `${favicon}\n`);

// Opaque white backgrounds keep the dark half visible in OS icon grids.
const white = '<rect width="128" height="128" fill="#fff"/>';
for (const [file, size] of [["apple-icon.png", 180], ["../public/brand/icon-192.png", 192], ["../public/brand/icon-512.png", 512]]) {
  await sharp(Buffer.from(square(size, symbolGroup, white))).png().toFile(path.join(appDir, file));
}

// ICO with independent PNG frames for legacy browsers and Windows shortcuts.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(size => sharp(Buffer.from(square(size, symbolGroup, white))).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + 16 * index;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(path.join(appDir, "favicon.ico"), Buffer.concat([header, ...frames]));

console.log("SVG del marchio, favicon, Apple Touch Icon e icone applicazione aggiornati.");
