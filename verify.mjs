import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

const manifest = JSON.parse(await readFile("engine/manifest.json", "utf8"))

for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  const bytes = await readFile(`dist/${file}`)
  const checksum = createHash("sha256").update(bytes).digest("hex")
  if (checksum !== manifest.artifacts[file]) {
    throw new Error(`${file} checksum mismatch: ${checksum}`)
  }
}

console.log(`Verified ${manifest.buildId}`)
