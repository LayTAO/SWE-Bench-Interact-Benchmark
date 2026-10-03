FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
ARG REPO_URL=https://github.com/element-plus/element-plus.git
ARG BASE_COMMIT=04f5bbc23b11dc09214596b5f014cee1db6f09a8
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate && pnpm install --frozen-lockfile --ignore-scripts
