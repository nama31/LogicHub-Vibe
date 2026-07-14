FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

# Create a user with UID 1000 to match the host
RUN groupadd -g 1000 appuser && useradd -u 1000 -g appuser -s /bin/bash -m appuser

WORKDIR /app

# Copy and install dependencies first for caching
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source and change ownership
COPY --chown=appuser:appuser . ./bot

# Ensure appuser owns the working directory
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Healthcheck checking if bot process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep "[p]ython -m bot.main" || exit 1

CMD ["python", "-m", "bot.main"]
