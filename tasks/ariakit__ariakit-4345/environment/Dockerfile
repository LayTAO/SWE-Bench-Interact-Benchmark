FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

RUN apt-get update -o Acquire::Retries=3 -o Acquire::http::Timeout=60 \
  && apt-get install -y --no-install-recommends \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libdbus-1-3 libgbm1 libnspr4 libnss3 libnss3-tools \
    libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 \
  && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=c5d9ee39276a8308dfb062186c4e440e6651630c

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN corepack enable \
  && corepack prepare pnpm@11.9.0 --activate \
  && pnpm install --frozen-lockfile

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN pnpm exec playwright install chromium
