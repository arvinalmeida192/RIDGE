FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim AS production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -s /bin/false ridge
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
RUN python -m src.train || true
USER ridge
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD curl -f http://localhost:8000/health || exit 1
COPY entrypoint.sh /entrypoint.sh
USER root
RUN chmod +x /entrypoint.sh
USER ridge
ENTRYPOINT ["/entrypoint.sh"]
