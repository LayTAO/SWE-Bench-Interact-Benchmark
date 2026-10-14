FROM public.ecr.aws/docker/library/node:24-bookworm-slim

ARG DEBIAN_MIRROR=deb.debian.org
ARG DEBIAN_SECURITY_MIRROR=security.debian.org

RUN sed -i "s|deb.debian.org|${DEBIAN_MIRROR}|g; s|security.debian.org|${DEBIAN_SECURITY_MIRROR}|g" /etc/apt/sources.list.d/debian.sources \
  && apt-get update -o Acquire::Retries=3 -o Acquire::http::Timeout=60 \
  && apt-get install -y --no-install-recommends \
    ca-certificates git python3 \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 \
    libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 \
    libxrandr2 xvfb fonts-noto-color-emoji fonts-unifont \
    libfontconfig1 libfreetype6 xfonts-scalable fonts-liberation \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf \
    fonts-freefont-ttf \
  && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=b166c1a7fe8dc9eeca41af5fd420179df5bac493
ARG NPM_REGISTRY=https://registry.npmjs.org

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY}
RUN corepack enable \
  && corepack prepare pnpm@10.32.1 --activate \
  && pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm install --frozen-lockfile

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN cd site && pnpm exec playwright install chromium
