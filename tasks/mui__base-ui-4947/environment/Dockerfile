FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=08e9ba68ab42b306d4fcc5d7ba998e7b936bc23c
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate && pnpm install --frozen-lockfile --ignore-scripts
