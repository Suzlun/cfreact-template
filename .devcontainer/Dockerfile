FROM node:24-bookworm

# Python と必要なツールをインストール
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# uv をインストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# pnpm を有効化
RUN corepack enable

# Wrangler をグローバルインストール
RUN npm install -g wrangler@4

# Codex CLI をグローバルインストール
RUN npm install -g @openai/codex

# node ユーザーに切り替え
USER node
