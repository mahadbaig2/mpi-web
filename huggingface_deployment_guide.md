# HuggingFace Model Deployment – Complete Action Plan

Step-by-step guide to deploy your 3 TensorFlow models (VGG16, ResNet50, DenseNet121) as an API on HuggingFace Spaces.

---

## Step 1: Create a HuggingFace Account & Space

1. Go to [huggingface.co](https://huggingface.co) and sign up / log in
2. Click your profile → **New Space**
3. Configure:
   - **Name**: `mpi-scan-analyzer`
   - **SDK**: Select **Docker** (for FastAPI) or **Gradio** (easier)
   - **Hardware**: Select **CPU Basic** (free tier, or upgrade for GPU)
   - **Visibility**: Private (for FYP) or Public
4. Click **Create Space**

---

## Step 2: Prepare Your Model Files

Your models are large (87–287MB). You have two options:

### Option A: Upload Directly to Space (Simpler)
- Upload your latest `.keras` files directly into the Space repo
- Use only the **latest** version of each model to save space:
  - `VGG16_20260126_172001.keras` (~177MB)
  - `ResNet50_20260126_182907.keras` (~287MB)
  - `DenseNet121_20260126_220413.keras` (~87MB)

### Option B: Use HuggingFace Model Hub (Better for Reuse)
1. Install `huggingface_hub`:
   ```bash
   pip install huggingface_hub
   ```
2. Upload models:
   ```python
   from huggingface_hub import HfApi
   api = HfApi()
   
   # Login first
   api.login(token="your_hf_token")
   
   # Create a model repo
   api.create_repo("your-username/mpi-scan-models", repo_type="model")
   
   # Upload each model
   api.upload_file(
       path_or_fileobj="C:/FYP/code/trained_models/VGG16_20260126_172001.keras",
       path_in_repo="VGG16.keras",
       repo_id="your-username/mpi-scan-models"
   )
   # Repeat for ResNet50 and DenseNet121
   ```
3. Then in your Space, download models at startup using `hf_hub_download()`

---

## Step 3: Create the Space Files

Your Space needs these files:

### `app.py` (FastAPI Server)

```python
import os
import numpy as np
import cv2
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

app = FastAPI(title="MPI Scan Analyzer API")

# Allow CORS from your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models at startup
models = {}

@app.on_event("startup")
def load_models():
    model_files = {
        "VGG16": "models/VGG16.keras",
        "ResNet50": "models/ResNet50.keras",
        "DenseNet121": "models/DenseNet121.keras",
    }
    for name, path in model_files.items():
        if os.path.exists(path):
            models[name] = tf.keras.models.load_model(path)
            print(f"✅ Loaded {name}")
        else:
            print(f"⚠️ Model not found: {path}")

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert uploaded image to model-ready format: (1, 224, 224, 1)"""
    # Open image
    image = Image.open(io.BytesIO(image_bytes)).convert("L")  # Grayscale
    image = image.resize((224, 224))
    
    # Convert to numpy
    img_array = np.array(image, dtype=np.float32)
    
    # Normalize to [0, 1]
    if img_array.max() > 1.0:
        img_array = img_array / 255.0
    
    # Reshape to (1, 224, 224, 1)
    img_array = np.expand_dims(img_array, axis=(0, -1))
    
    return img_array

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Run inference on all 3 models and return predictions"""
    image_bytes = await file.read()
    img_array = preprocess_image(image_bytes)
    
    results = {}
    
    for name, model in models.items():
        # Models expect: image, has_mask, mask (for feature masking models)
        # For standard models, just pass image
        try:
            # Try with all 3 inputs (for Proposed model)
            pred = model.predict({
                "image": img_array,
                "has_mask": np.array([[0.0]]),
                "mask": np.zeros((1, 224, 224, 1), dtype=np.float32)
            }, verbose=0)
        except:
            # Fallback for standard models
            pred = model.predict(img_array, verbose=0)
        
        probability = float(pred[0][0])
        results[name] = {
            "probability": probability,
            "prediction": "Abnormal" if probability >= 0.5 else "Normal",
            "risk_level": (
                "Low" if probability < 0.33
                else "Medium" if probability < 0.66
                else "High"
            ),
            "confidence": round(abs(probability - 0.5) * 200, 1)
        }
    
    # Ensemble (average)
    avg_prob = np.mean([r["probability"] for r in results.values()])
    results["ensemble"] = {
        "probability": float(avg_prob),
        "prediction": "Abnormal" if avg_prob >= 0.5 else "Normal",
        "risk_level": (
            "Low" if avg_prob < 0.33
            else "Medium" if avg_prob < 0.66
            else "High"
        ),
        "confidence": round(abs(avg_prob - 0.5) * 200, 1)
    }
    
    return results

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(models.keys())}
```

### `Dockerfile`

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HuggingFace Spaces expects port 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
```

### `requirements.txt`

```
tensorflow-cpu==2.15.0
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
numpy==1.26.3
opencv-python-headless==4.9.0.80
Pillow==10.2.0
```

> [!TIP]
> Use `tensorflow-cpu` instead of `tensorflow` to keep the Docker image smaller. Your models were trained on GPU but inference works fine on CPU.

---

## Step 4: Upload Everything to the Space

### Using Git (Recommended)

```bash
# Clone your space
git lfs install
git clone https://huggingface.co/spaces/your-username/mpi-scan-analyzer
cd mpi-scan-analyzer

# Copy files
cp app.py Dockerfile requirements.txt ./

# Create models directory and copy your latest models
mkdir models
cp "C:/FYP/code/trained_models/VGG16_20260126_172001.keras" models/VGG16.keras
cp "C:/FYP/code/trained_models/ResNet50_20260126_182907.keras" models/ResNet50.keras
cp "C:/FYP/code/trained_models/DenseNet121_20260126_220413.keras" models/DenseNet121.keras

# Track large files with Git LFS
git lfs track "*.keras"

# Commit and push
git add .
git commit -m "Add MPI scan analyzer API with models"
git push
```

> [!WARNING]
> The free tier has a **10GB storage limit**. Your 3 models total ~551MB, which is fine. But if you also want the Proposed model, that's another ~87MB.

---

## Step 5: Test Your Deployed API

Once deployed (takes 5–10 minutes to build), test it:

```bash
# Health check
curl https://your-username-mpi-scan-analyzer.hf.space/health

# Prediction
curl -X POST https://your-username-mpi-scan-analyzer.hf.space/predict \
  -F "file=@test_mpi_image.png"
```

---

## Step 6: Connect to Your Next.js Frontend

In your `.env.local`:
```
PYTHON_BACKEND_URL=https://your-username-mpi-scan-analyzer.hf.space
```

The `app/api/predict/route.ts` will proxy requests to this URL.

---

## Important Notes

| Aspect | Detail |
|--------|--------|
| **Free Tier** | 2 vCPU, 16GB RAM, CPU only |
| **Cold Start** | ~30–60 seconds if Space sleeps after inactivity |
| **Sleep Timeout** | Spaces sleep after 48h of inactivity (free tier) |
| **Rate Limits** | No hard limit, but shared resources |
| **GPU Option** | Upgrade to T4 ($0.60/hr) for faster inference |

> [!CAUTION]
> The free tier will **sleep** after 48 hours of inactivity. For your FYP demo, make sure to "wake up" the Space 1–2 minutes before presenting by visiting the URL.
