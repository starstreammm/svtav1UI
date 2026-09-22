<div align="center">
  <img src="./public/icon.png" alt="structure" width="288" />
  <br />
  <br />
  <img alt="Node Current" src="https://img.shields.io/node/v/%40rolldown%2Fplugin-babel">
  <img alt="Python Version" src="https://img.shields.io/badge/python-3.12%2B-blue">
  <img alt="GitHub License" src="https://img.shields.io/github/license/starstreammm/svtav1UI">
  <img alt="GitHub Release" src="https://img.shields.io/github/v/release/starstreammm/svtav1UI">
  <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/starstreammm/svtav1UI/publish.yml?label=Release">
  <br />
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/starstreammm/svtav1UI">
	<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/starstreammm/svtav1UI">
	<img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/starstreammm/svtav1UI">
 </div>

## New V4 Released!!!

New features:

- Add support for images! Now the program can transcode images to AVIF just like videos before.
- Fix various display issues & providing more details.
- Rebuild the queue part for new image function.

## Features

- With WebUI, convenient for checking progress and operation.
- Run `ffmpeg` locally, without performance loss.
- Support full video normalization parameters, including pixel format and color space.
- Task queue, with automatic hang-up interrupt.
- With task schedule, easily plan your transcoding time.
- Bulk import & Global settings.
- GBM task prediction, more precise and lightly.
- AAutomatic Speech Recognition (ASR) by whisper.cpp and translation by llm (support openai API, mlx and llama).utomatic Speech Recognition & Translation.

### Upgrade to V4

In the all-new version 4, the database structure and program data path has been changed.

Thus, if you want to upgrade to v4, the recommanded steps are totally uninstall the V3 and do a completely reinstall.

If you truly want to save the history (which used for ETA Model), you can do an manully update.

1. Find the `config.db`.
2. Delete all the tables except `history`.
3. Rename the `history` table to `video_history`.
4. Move the `config.db` to `data/`.

## Installations

### 1. Install FFmpeg

Follow the instruction from [ffmpeg.org](https://ffmpeg.org).

### 2. Install Api

- Download the [latest release](https://github.com/starstreammm/svtav1UI/releases/latest/download/backend.tar.gz).
- Unzip the file:

```bash
tar -xzf backend.tar.gz
```

- Install pip packages:

```bas
pip install -r requirements.txt
```

- Run Api:

```bash
uvicorn main:app --host 0.0.0.0 --port 38889
```

### 3. Install Docker

Docker Hub

```bash
docker run -d -p 8889:80 starstreammm/stvav1ui:latest
```

Github

```bash
docker run -d -p 8889:80 ghcr.io/starstreammm/svtav1ui:latest
```

### 4. Install libomp

The XGBoost need `libomp` to function. Some distributions/operating systems may include this component by default.

#### MacOS

```bash
brew install libomp
```

#### Linux/Windows

Search for it.

### 5. (Optional) Install Whisper.cpp

The ASR function is base on it.

To install, follow the instructions at [Whisper.cpp](https://github.com/ggml-org/whisper.cpp).

### 6. (Optional) Install LLM framework

You can choose one from openai API, mlx and llama.

For OpenAI API,

```bash
pip install openai
```

For MLX (only recommendated for Apple Silicon),

```bash
pip install mlx-lm
```

For llama.cpp,

```bash
pip install llama-cpp-python
```

## Links

FFmpeg: [https://ffmpeg.org](https://ffmpeg.org)

SVT-AV1 Encoder: [https://gitlab.com/AOMediaCodec/SVT-AV1/](https://gitlab.com/AOMediaCodec/SVT-AV1/)

MUI: [https://mui.com/material-ui/](https://mui.com/material-ui/)
