# syntax=docker/dockerfile:1.7

FROM emscripten/emsdk:3.1.40 AS base
ENV PREFIX=/opt
ENV CFLAGS="-I/opt/include -O3"
ENV CXXFLAGS="-I/opt/include -O3"
ENV LDFLAGS="-L/opt/lib -O3"
ENV EM_PKG_CONFIG_PATH=/opt/lib/pkgconfig
RUN apt-get update && apt-get install -y --no-install-recommends \
    autoconf automake ca-certificates cmake curl libtool pkg-config xz-utils && \
    rm -rf /var/lib/apt/lists/*

FROM base AS lame
WORKDIR /src
RUN curl -L --fail -o lame.tar.gz \
      https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz && \
    echo "ddfe36cab873794038ae2c1210557ad34857a4b6bdc515785d1da9e175b1da1e  lame.tar.gz" | sha256sum -c - && \
    tar -xzf lame.tar.gz --strip-components=1
RUN emconfigure ./configure \
      --prefix=/opt --host=i686-linux --disable-shared --enable-static \
      --disable-frontend --disable-analyzer-hooks --disable-dependency-tracking \
      --disable-gtktest && \
    emmake make -j"$(nproc)" && emmake make install

FROM base AS soxr
WORKDIR /src
RUN curl -L --fail -o soxr.tar.xz \
      https://downloads.sourceforge.net/project/soxr/soxr-0.1.3-Source.tar.xz && \
    echo "b111c15fdc8c029989330ff559184198c161100a59312f5dc19ddeb9b5a15889  soxr.tar.xz" | sha256sum -c - && \
    tar -xJf soxr.tar.xz --strip-components=1
RUN emcmake cmake -S . -B build \
      -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/opt \
      -DBUILD_SHARED_LIBS=OFF -DBUILD_TESTS=OFF -DBUILD_EXAMPLES=OFF \
      -DWITH_OPENMP=OFF -DWITH_LSR_BINDINGS=OFF \
      -DWITH_PFFFT=OFF -DWITH_AVFFT=OFF \
      -DWITH_CR32S=OFF -DWITH_CR64S=OFF -DWITH_VR32=OFF \
      -DWITH_CR32=ON -DWITH_CR64=ON && \
    cmake --build build --parallel && cmake --install build

FROM base AS ogg
WORKDIR /src
RUN curl -L --fail -o ogg.tar.xz \
      https://downloads.xiph.org/releases/ogg/libogg-1.3.5.tar.xz && \
    echo "c4d91be36fc8e54deae7575241e03f4211eb102afb3fc0775fbbc1b740016705  ogg.tar.xz" | sha256sum -c - && \
    tar -xJf ogg.tar.xz --strip-components=1
RUN emconfigure ./configure \
      --prefix=/opt --host=i686-linux --disable-shared --enable-static \
      --disable-dependency-tracking && \
    emmake make -j"$(nproc)" && emmake make install

FROM base AS vorbis
WORKDIR /src
COPY --from=ogg /opt /opt
RUN curl -L --fail -o vorbis.tar.xz \
      https://downloads.xiph.org/releases/vorbis/libvorbis-1.3.7.tar.xz && \
    echo "b33cc4934322bcbf6efcbacf49e3ca01aadbea4114ec9589d1b1e9d20f72954b  vorbis.tar.xz" | sha256sum -c - && \
    tar -xJf vorbis.tar.xz --strip-components=1 && \
    sed -i 's/-mno-ieee-fp//g' configure
RUN emconfigure ./configure \
      --prefix=/opt --host=i686-linux --disable-shared --enable-static \
      --disable-dependency-tracking --disable-examples && \
    emmake make -j"$(nproc)" && emmake make install

FROM base AS opus
WORKDIR /src
RUN curl -L --fail -o opus.tar.gz \
      https://downloads.xiph.org/releases/opus/opus-1.5.2.tar.gz && \
    echo "65c1d2f78b9f2fb20082c38cbe47c951ad5839345876e46941612ee87f9a7ce1  opus.tar.gz" | sha256sum -c - && \
    tar -xzf opus.tar.gz --strip-components=1
RUN CFLAGS="$CFLAGS -fno-stack-protector" emcmake cmake -S . -B build \
      -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/opt \
      -DCMAKE_INSTALL_LIBDIR=lib \
      -DBUILD_SHARED_LIBS=OFF -DOPUS_BUILD_SHARED_LIBRARY=OFF \
      -DOPUS_BUILD_PROGRAMS=OFF -DOPUS_BUILD_TESTS=OFF -DOPUS_BUILD_EXAMPLES=OFF \
      -DOPUS_FIXED_POINT=ON -DOPUS_HARDENING=OFF -DOPUS_STACK_PROTECTOR=OFF \
      -DOPUS_X86_MAY_HAVE_SSE=OFF -DOPUS_X86_MAY_HAVE_SSE2=OFF \
      -DOPUS_X86_MAY_HAVE_SSE4_1=OFF -DOPUS_X86_MAY_HAVE_AVX=OFF \
      -DOPUS_X86_MAY_HAVE_AVX2=OFF && \
    cmake --build build --parallel && cmake --install build

FROM base AS ffmpeg
WORKDIR /src
COPY --from=lame /opt /opt
COPY --from=soxr /opt /opt
COPY --from=ogg /opt /opt
COPY --from=vorbis /opt /opt
COPY --from=opus /opt /opt
RUN curl -L --fail -o ffmpeg.tar.xz https://ffmpeg.org/releases/ffmpeg-5.1.10.tar.xz && \
    echo "392306d6fc45dab0e9e0ea55381e071842e83a2fb31d320aeda40477a7766293  ffmpeg.tar.xz" | sha256sum -c - && \
    tar -xJf ffmpeg.tar.xz --strip-components=1
RUN emconfigure ./configure \
      --target-os=none --arch=x86_32 --enable-cross-compile \
      --nm=emnm --ar=emar --ranlib=emranlib --cc=emcc --cxx=em++ --objcc=emcc --dep-cc=emcc \
      --pkg-config-flags=--static \
      --extra-cflags="$CFLAGS" --extra-cxxflags="$CXXFLAGS" --extra-ldflags="$LDFLAGS" \
      --disable-everything --disable-autodetect --disable-programs --disable-doc --disable-debug \
      --disable-asm --disable-stripping --disable-runtime-cpudetect \
      --disable-pthreads --disable-w32threads --disable-os2threads \
      --disable-network --disable-avdevice --disable-postproc --disable-swscale \
      --disable-gpl --disable-nonfree --enable-small \
      --enable-avcodec --enable-avformat --enable-avfilter --enable-swresample \
      --enable-libsoxr --enable-libmp3lame --enable-libopus --enable-libvorbis \
      --enable-protocol=file \
      --enable-demuxer=aiff,caf,flac,mov,mp3,ogg,wav,matroska \
      --enable-muxer=flac,mp3,null,wav,ogg,opus,mp4,ipod,webm \
      --enable-decoder=alac,flac,mp3,mp3float,opus,vorbis \
      --enable-decoder=pcm_s8,pcm_u8,pcm_s16le,pcm_s16be,pcm_u16le,pcm_u16be \
      --enable-decoder=pcm_s24le,pcm_s24be,pcm_u24le,pcm_u24be \
      --enable-decoder=pcm_s32le,pcm_s32be,pcm_u32le,pcm_u32be \
      --enable-decoder=pcm_f32le,pcm_f32be,pcm_f64le,pcm_f64be,pcm_alaw,pcm_mulaw \
      --enable-encoder=flac,libmp3lame,pcm_s16le,pcm_s24le,pcm_f32le,alac,libopus,libvorbis \
      --enable-parser=flac,mpegaudio,opus,vorbis \
      --enable-filter=abuffer,abuffersink,aformat,anull,aresample,volume && \
    emmake make -j"$(nproc)"

FROM base AS wasm
WORKDIR /src
COPY --from=ffmpeg /src /src
COPY --from=lame /opt /opt
COPY --from=soxr /opt /opt
COPY --from=ogg /opt /opt
COPY --from=vorbis /opt /opt
COPY --from=opus /opt /opt
RUN curl -L --fail -o wrapper.tar.gz \
      https://github.com/ffmpegwasm/ffmpeg.wasm/archive/71aa99d37c02a7b4c435275ca9ef50e612f6efa1.tar.gz && \
    echo "53c5842f160cece0e39345876f9483b56aa84b966637ff6f624353a0fa884219  wrapper.tar.gz" | sha256sum -c - && \
    mkdir /wrapper /src/src && tar -xzf wrapper.tar.gz -C /wrapper --strip-components=1 && \
    cp -R /wrapper/src/bind /src/src/bind && cp -R /wrapper/src/fftools /src/src/fftools
RUN mkdir -p /dist && emcc \
      -I. -I./src/fftools -I/opt/include -L/opt/lib \
      -Llibavcodec -Llibavfilter -Llibavformat -Llibavutil -Llibswresample \
      -lavcodec -lavfilter -lavformat -lavutil -lswresample -lsoxr -lmp3lame \
      -lopus -lvorbisenc -lvorbis -logg \
      -O3 -msimd128 -Wno-deprecated-declarations \
      -sENVIRONMENT=worker -sWASM_BIGINT -sMODULARIZE -sEXPORT_ES6 \
      -sEMULATE_FUNCTION_POINTER_CASTS \
      -sINITIAL_MEMORY=32MB -sALLOW_MEMORY_GROWTH -sMAXIMUM_MEMORY=2GB \
      -sEXPORT_NAME=createFFmpegCore \
      -sEXPORTED_FUNCTIONS="$(node src/bind/ffmpeg/export.js)" \
      -sEXPORTED_RUNTIME_METHODS="$(node src/bind/ffmpeg/export-runtime.js)" \
      -lworkerfs.js --pre-js src/bind/ffmpeg/bind.js \
      src/fftools/cmdutils.c src/fftools/ffmpeg.c src/fftools/ffmpeg_filter.c \
      src/fftools/ffmpeg_hw.c src/fftools/ffmpeg_mux.c src/fftools/ffmpeg_opt.c \
      src/fftools/opt_common.c src/fftools/ffprobe.c \
      -o /dist/ffmpeg-core.js

FROM scratch AS export
COPY --from=wasm /dist/ffmpeg-core.js /ffmpeg-core.js
COPY --from=wasm /dist/ffmpeg-core.wasm /ffmpeg-core.wasm
