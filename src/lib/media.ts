import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Media } from "@/content/extras";

/**
 * Build-time screenshot discovery for project pages. Looks in
 * public/media/projects/<slug>/ first, then the older public/media/<slug>/.
 * Reads pixel sizes from the file header so next/image gets real dimensions.
 * Server-only (uses node:fs); pages are prerendered, so this never ships.
 */

const IMG = /\.(jpe?g|png|webp)$/i;

function sizeOf(buf: Buffer): { width: number; height: number } | null {
  // PNG: IHDR at byte 16
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // WebP (RIFF....WEBP)
  if (buf.toString("ascii", 0, 4) === "RIFF") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X")
      return {
        width: 1 + buf.readUIntLE(24, 3),
        height: 1 + buf.readUIntLE(27, 3),
      };
    if (kind === "VP8 ")
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    if (kind === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  // JPEG: walk segments to the first SOFn
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o < buf.length) {
      if (buf[o] !== 0xff) return null;
      const marker = buf[o + 1];
      const len = buf.readUInt16BE(o + 2);
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: buf.readUInt16BE(o + 5),
          width: buf.readUInt16BE(o + 7),
        };
      }
      o += 2 + len;
    }
  }
  return null;
}

const humanize = (file: string) =>
  file
    .replace(IMG, "")
    .replace(/^\d+[-_]/, "")
    .replace(/[-_]+/g, " ")
    .trim();

/** Screenshots for a project page, sorted by filename. Skips og.* cover images. */
export function projectScreenshots(slug: string, name: string): Media[] {
  const dirs = [
    ["media", "projects", slug],
    ["media", slug],
  ];
  for (const parts of dirs) {
    const abs = join(process.cwd(), "public", ...parts);
    if (!existsSync(abs)) continue;
    const files = readdirSync(abs)
      .filter((f) => IMG.test(f) && !/^og\./i.test(f))
      .sort();
    const out: Media[] = [];
    for (const f of files) {
      const size = sizeOf(readFileSync(join(abs, f)));
      if (!size) continue;
      out.push({
        src: `/${parts.join("/")}/${f}`,
        alt: `${name}: ${humanize(f)}`,
        ...size,
      });
    }
    if (out.length) return out;
  }
  return [];
}
