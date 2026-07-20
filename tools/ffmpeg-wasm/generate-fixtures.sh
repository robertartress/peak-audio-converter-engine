#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURES="$ROOT_DIR/packages/audio-converter-engine/tests/fixtures"
mkdir -p "$FIXTURES"

ffmpeg -hide_banner -loglevel error -y -f lavfi -i "sine=frequency=997:sample_rate=48000:duration=2" -c:a pcm_s24le "$FIXTURES/sine-48k-24bit-mono.wav"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "aevalsrc=0|0:s=44100:d=2" -c:a pcm_f32le "$FIXTURES/silence-44k-float-stereo.wav"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "sine=frequency=1000:sample_rate=44100:duration=2" -filter_complex "[0:a]asplit=2[l][r];[l][r]amerge=inputs=2" -c:a pcm_s16le "$FIXTURES/sine-44k-16bit-stereo.wav"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a flac "$FIXTURES/sine.flac"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a libmp3lame -b:a 320k "$FIXTURES/sine.mp3"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a alac "$FIXTURES/sine-alac.m4a"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a libvorbis "$FIXTURES/sine.ogg"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a libopus "$FIXTURES/sine.opus"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a pcm_s24be "$FIXTURES/sine.aiff"
ffmpeg -hide_banner -loglevel error -y -i "$FIXTURES/sine-44k-16bit-stereo.wav" -c:a pcm_s24le "$FIXTURES/sine.caf"
