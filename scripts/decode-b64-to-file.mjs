#!/usr/bin/env node
/**
 * One-off helper: decode base64 (stdin or argv[1]) into argv[2].
 * Usage: node scripts/decode-b64-to-file.mjs <base64> <outPath>
 */
import { writeFileSync } from "node:fs";

const b64 = process.argv[2] ? process.argv[2] : "";
const out = process.argv[3];
if (!out || !b64) {
  console.error("Usage: node scripts/decode-b64-to-file.mjs <base64> <outPath>");
  process.exit(1);
}
writeFileSync(out, Buffer.from(b64.replace(/\s/g, ""), "base64"));
