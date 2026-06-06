# Model files (Option A — upload here)

Copy your three trained `.keras` files into **this folder** with these **exact names**:

```
models/VGG16_20260508_200536.keras
models/ResNet50_20260502_141714.keras
models/DenseNet121_20260502_151212.keras
```

## Upload steps

From this repo root (`mpi-scan-analyzer/`):

```bash
git lfs install
git lfs track "*.keras"
git add models/*.keras .gitattributes
git commit -m "Add trained MPI models"
git push
```

Wait for the Space to rebuild (~5–15 min), then verify:

```bash
curl https://mirzamahad-mpi-scan-analyzer.hf.space/health
```

Expected:

```json
{"status":"ok","models_loaded":["VGG16","ResNet50","DenseNet121"]}
```

After pushing models without waiting for rebuild, you can also call:

```bash
curl -X POST https://mirzamahad-mpi-scan-analyzer.hf.space/reload
```
