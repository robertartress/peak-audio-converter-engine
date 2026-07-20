# Peak browser audio converter engine

Build materials for the browser audio converter engine.

Build from a clean environment with `./tools/ffmpeg-wasm/build-core.sh`. The Dockerfile downloads checksum-pinned sources, builds a single-thread audio-only core, exports versioned same-origin assets, updates `manifest.json`, verifies the wrapper identity and measures raw/gzip/Brotli sizes.

The core is an audio-only FFmpeg build with local file input.

The release includes the source archives identified in `manifest.json`, build
scripts, patches, generated artifacts, and license notices.
