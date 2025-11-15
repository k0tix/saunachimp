FROM python:3.10.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv (standalone binary)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

COPY pyproject.toml .
COPY uv.lock .

RUN uv pip install --system .

COPY . .

EXPOSE 8888

CMD ["uv", "run", "python", "wellness.py"]
