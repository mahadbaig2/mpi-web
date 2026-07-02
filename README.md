# CardioScan AI – AI-Powered MPI Scan Analyzer

CardioScan AI is a state-of-the-art web platform designed to detect and predict heart diseases from Myocardial Perfusion Imaging (MPI) scans. This project leverages an ensemble of deep learning models (VGG16, ResNet50, and DenseNet121) to provide accurate diagnostic support, complemented by AI-generated clinical reports using the Groq API.

## 🌟 Key Features

- **Multi-Model Ensemble Analysis**: Uses three specialized CNN architectures (VGG16, ResNet50, DenseNet121) for robust classification.
- **Premium Medical Dashboard**: A dark-themed, glassmorphic interface for seamless image uploading and analysis.
- **AI-Generated Clinical Reports**: Powered by Groq's `moonshotai/kimi-k2-instruct-0905` model, providing structured summaries, risk assessments, and clinical recommendations.
- **Drag-and-Drop Upload**: Supports multiple formats including JPG, PNG, DICOM, and NPY.
- **Analysis History**: Persistently store and review previous scan results and reports.
- **Portable PDF Reports**: Generate and print professional clinical reports directly from the browser.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Custom Design System)
- **AI Engine**: Groq SDK (`moonshotai/kimi-k2-instruct-0905`)
- **Backend Architecture**: API routes serving as a proxy for TensorFlow-based model inference.
- **Authentication**: LocalStorage-based session management (extendable to Supabase).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- NPM / Yarn / PNPM
- A Groq API Key (from [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mahadbaig2/MPI_scan_analysis_web_platform.git
   cd MPI_scan_analysis_web_platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PYTHON_BACKEND_URL=your_model_api_url_here (optional, defaults to mock for demo)
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧠 Model Deployment

The deep learning models are designed to be served via a Python FastAPI backend or HuggingFace Spaces. 

- **Models**: VGG16, ResNet50, DenseNet121 (plus a Proposed Model with feature masking).
- **Input**: 224x224x1 Grayscale MPI Image.
- **Output**: Sigmoid probability (Normal/Abnormal classification).

For detailed instructions on deploying the models, refer to the [HuggingFace Deployment Guide](./huggingface_deployment_guide.md).

## 📊 Performance Summary

| Model | AUC | Accuracy | Sensitivity | Specificity |
|-------|-----|----------|-------------|-------------|
| VGG16 | 0.864 | 84.1% | 88.2% | 74.3% |
| ResNet50 | 0.840 | 83.4% | 91.2% | 72.5% |
| **DenseNet121** | **0.890** | **87.4%** | **93.0%** | **75.2%** |

## 📜 Important Note

This platform is a Final Year Project (FYP) and is intended for educational and demonstrative purposes only. It is **not** a substitute for professional medical diagnosis or consultation.

---
© 2026 CardioScan AI Team. Developed for MPI Heart Disease Prediction.
