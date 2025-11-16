FROM node:24-bookworm

# Python と必要なツールをインストール
# Serena MCP には Python 3.11+ (3.12+ は不可) が必要
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# uv をインストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# uv バイナリに実行権限を付与し、/usr/local/bin にコピー（すべてのユーザーがアクセス可能）
RUN chmod +x /root/.local/bin/uv /root/.local/bin/uvx && \
    cp /root/.local/bin/uv /usr/local/bin/uv && \
    cp /root/.local/bin/uvx /usr/local/bin/uvx && \
    chmod 755 /usr/local/bin/uv /usr/local/bin/uvx

# pnpm を有効化
RUN corepack enable

# Wrangler をグローバルインストール
RUN npm install -g wrangler@4

# Codex CLI をグローバルインストール
RUN npm install -g @openai/codex

# node ユーザーに切り替え
USER node
