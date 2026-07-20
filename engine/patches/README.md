# Patches

No patch files are applied. The Docker build removes libvorbis's unsupported
`-mno-ieee-fp` configure flag and configures Opus for fixed-point WebAssembly
with x86 SIMD disabled. These build-time changes are recorded in
`engine/manifest.json` and `tools/ffmpeg-wasm/Dockerfile`.
