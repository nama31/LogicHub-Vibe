FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/backend

RUN chmod +x start.sh

EXPOSE 8000

# for local development:
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# for deployment (runs migrations then starts the server):
CMD ["./start.sh"]
