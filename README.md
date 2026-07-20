# Peak Audio Converter Engine

Reproducible source and build materials for Peak Mastering's browser audio
converter.

The engine is an audio-only FFmpeg 5.1.10 WebAssembly build. GPL, nonfree,
network, video, and AAC features are disabled. The current v3 build includes
FFmpeg, libsoxr, LAME, libogg, libvorbis, Opus, ffmpeg.wasm bindings, and the
Emscripten runtime.

## Build

Requirements: Docker with BuildKit and Node.js 18 or newer.

```sh
./build.sh
```

The command creates `dist/ffmpeg-core.js`, `dist/ffmpeg-core.wasm`, and the
matching manifest.

## Corresponding Source

The `v3-no-aac` release includes the exact upstream archives named in
`engine/manifest.json`, the build scripts, patches, generated artifacts, and
matching checksums.

For source or relinking questions, email robbie@peakmastering.com.

## Licenses

- FFmpeg: LGPL-2.1-or-later for this GPL-disabled configuration
- libsoxr: LGPL-2.1-or-later
- LAME 3.100: LGPL-2.0-or-later
- libogg, libvorbis, and Opus: BSD-3-Clause
- ffmpeg.wasm bindings: MIT
- Emscripten runtime portions: MIT and NCSA terms in the included notices

See `engine/licenses/` for the complete notices.
