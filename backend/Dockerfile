FROM python:3.13-slim

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code (the .env file is intentionally NOT copied —
# credentials are injected at runtime via Docker environment / env_file)
COPY app ./app

EXPOSE 8080

# Railway injects a $PORT env var — listen on it, fall back to 8080 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
