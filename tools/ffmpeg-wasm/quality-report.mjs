import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../..",
);
const fixtureDir = path.join(
  root,
  "packages/audio-converter-engine/tests/fixtures",
);
const outputDir =
  process.env.CONVERTER_QUALITY_OUTPUT ??
  "/var/folders/nm/0n66pz910q7gbp0tyfhvfgjc0000gn/T/opencode/converter-quality";
const nativeFloat = path.join(outputDir, "native-44k-float-src.wav");

execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  path.join(fixtureDir, "sine-48k-24bit-mono.wav"),
  "-af",
  "aresample=44100:resampler=soxr:precision=28",
  "-c:a",
  "pcm_f32le",
  nativeFloat,
]);

function probe(file) {
  return JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,bit_rate:stream=codec_name,sample_rate,channels,bits_per_sample,bits_per_raw_sample,bit_rate",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    ),
  );
}

async function readPcmWav(file) {
  const bytes = await readFile(file);
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      const containerTag = bytes.readUInt16LE(start);
      format = {
        tag:
          containerTag === 0xfffe && size >= 40
            ? bytes.readUInt16LE(start + 24)
            : containerTag,
        channels: bytes.readUInt16LE(start + 2),
        sampleRate: bytes.readUInt32LE(start + 4),
        bits: bytes.readUInt16LE(start + 14),
      };
    }
    if (id === "data") data = bytes.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  if (!format || !data) throw new Error(`Invalid WAV: ${file}`);
  const samples = [];
  const byteDepth = format.bits / 8;
  for (let index = 0; index + byteDepth <= data.length; index += byteDepth) {
    if (format.tag === 3 && format.bits === 32)
      samples.push(data.readFloatLE(index));
    else if (format.bits === 16) samples.push(data.readInt16LE(index) / 32768);
    else if (format.bits === 24) {
      let value = data.readUIntLE(index, 3);
      if (value & 0x800000) value -= 0x1000000;
      samples.push(value / 8388608);
    } else
      throw new Error(`Unsupported WAV format ${format.tag}/${format.bits}`);
  }
  return { ...format, samples };
}

function residual(a, b) {
  const length = Math.min(a.length, b.length);
  let sumSquares = 0;
  let maxAbsolute = 0;
  for (let index = 0; index < length; index++) {
    const difference = a[index] - b[index];
    sumSquares += difference * difference;
    maxAbsolute = Math.max(maxAbsolute, Math.abs(difference));
  }
  return {
    framesCompared: length,
    maxAbsolute,
    rms: Math.sqrt(sumSquares / length),
  };
}

const wasmFloat = await readPcmWav(
  path.join(outputDir, "wasm-44k-float-src.wav"),
);
const nativeFloatData = await readPcmWav(nativeFloat);
const source24 = await readPcmWav(
  path.join(fixtureDir, "sine-48k-24bit-mono.wav"),
);
const dithered16 = await readPcmWav(
  path.join(outputDir, "wasm-48k-16bit-dither.wav"),
);
const ditherErrors = dithered16.samples.map(
  (sample, index) => sample - source24.samples[index],
);
const ditherMean =
  ditherErrors.reduce((sum, value) => sum + value, 0) / ditherErrors.length;
const ditherRms = Math.sqrt(
  ditherErrors.reduce((sum, value) => sum + (value - ditherMean) ** 2, 0) /
    ditherErrors.length,
);

const report = {
  buildId: "peak-audio-converter-ffmpeg-5.1.10-v1-b3ce404d",
  measuredAt: new Date().toISOString(),
  environment: {
    browser: "Playwright Chromium 129.0.6668.29",
    nativeFfmpeg: execFileSync("ffmpeg", ["-version"], {
      encoding: "utf8",
    }).split("\n")[0],
    architecture: process.arch,
    platform: process.platform,
  },
  floatSrc44100: {
    wasm: probe(path.join(outputDir, "wasm-44k-float-src.wav")),
    native: probe(nativeFloat),
    residual: residual(wasmFloat.samples, nativeFloatData.samples),
  },
  dither24To16SameRate: {
    output: probe(path.join(outputDir, "wasm-48k-16bit-dither.wav")),
    sampleCount: ditherErrors.length,
    errorMean: ditherMean,
    errorRms: ditherRms,
    errorRmsLsb16: ditherRms * 32768,
    samplesDifferingFromUnditheredRounding: dithered16.samples.filter(
      (value, index) =>
        value !==
        Math.max(
          -1,
          Math.min(
            32767 / 32768,
            Math.round(source24.samples[index] * 32768) / 32768,
          ),
        ),
    ).length,
  },
  flac24: probe(path.join(outputDir, "wasm-44k-24bit.flac")),
  mp3_320k: probe(path.join(outputDir, "wasm-44k-320k.mp3")),
};

await writeFile(
  path.join(root, "packages/audio-converter-engine/quality-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(report);
