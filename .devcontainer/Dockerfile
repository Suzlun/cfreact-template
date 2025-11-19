FROM node:24-bookworm

# Python と必要なツールをインストール
# Serena MCP には Python 3.11+ (3.12+ は不可) が必要
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    # Playwright ブラウザの依存関係
    libnspr4 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    libx11-xcb1 \
    libxcursor1 \
    libgtk-3-0 \
    libgtk-4-1 \
    libgraphene-1.0-0 \
    libwoff1 \
    libvpx7 \
    libopus0 \
    libgstreamer1.0-0 \
    libgstreamer-gl1.0-0 \
    gstreamer1.0-libav \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    flite \
    libavif15 \
    libharfbuzz-icu0 \
    libepoxy0 \
    libenchant-2-2 \
    libsecret-1-0 \
    libhyphen0 \
    libwayland-egl1 \
    libwayland-client0 \
    libmanette-0.2-0 \
    libatk-bridge2.0-0 \
    libgles2 \
    libx264-164 \
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

# node ユーザーとして spec-kit をインストール
RUN uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
ENV PATH="/home/node/.local/bin:$PATH"
