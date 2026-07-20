# Browser benchmark procedure

1. Start the app with `cd app && wasp start`.
2. Open `/audio-converter` in a clean browser profile with DevTools closed.
3. Convert each generated four-minute fixture and record engine cold/warm load, wall time, audio duration, input/output size and browser task-manager memory.
4. Repeat three times and report the median. Do not infer unrun browser or device results.

Required cases: 48 kHz/24-bit WAV to 44.1 kHz/16-bit WAV, WAV to 320 kbps MP3, 96 kHz/24-bit WAV to 44.1 kHz/24-bit WAV, FLAC to WAV, and ALAC/M4A to WAV.
