FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

# Create a user with UID 1000 to match the host
RUN groupadd -g 1000 appuser && useradd -u 1000 -g appuser -s /bin/bash -m appuser

WORKDIR /app/backend

# Copy and install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code and change ownership
COPY --chown=appuser:appuser . /app/backend

RUN chmod +x start.sh

# Switch to the non-root user
USER appuser

EXPOSE 8000

# Add a healthcheck instruction
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# for local development:
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# for deployment (runs migrations then starts the server):
CMD ["./start.sh"]
