---
title: Mpi Scan Analyzer
emoji: 🫀
colorFrom: purple
colorTo: blue
sdk: docker
sdk_version: 6.9.0
app_file: app.py
pinned: false
---

# MPI Scan Analyzer — HuggingFace Space

FastAPI inference server for CardioScan AI (VGG16, ResNet50, DenseNet121 ensemble).

## Model setup (Option A)

Upload three `.keras` files to the **`models/`** folder — see [models/README.md](./models/README.md) for exact filenames and Git LFS steps.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/health` | `{ models_loaded: [...] }` |
| POST | `/predict` | Upload image, get ensemble predictions |
| POST | `/reload` | Re-scan `models/` after uploading files |

Space URL: [mirzaMahad/mpi-scan-analyzer](https://huggingface.co/spaces/mirzaMahad/mpi-scan-analyzer)
