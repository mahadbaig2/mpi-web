FROM python:3.10-slim



# Set the working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create models directory (important if models are placed here natively)
RUN mkdir -p models

# Copy the rest of the application
COPY . .

# Expose port 7860 (HuggingFace default for Spaces)
EXPOSE 7860

# Command to run the FastAPI application on 0.0.0.0 is required for Spaces
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
