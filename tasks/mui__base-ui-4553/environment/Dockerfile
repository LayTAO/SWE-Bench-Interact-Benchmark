FROM mcr.microsoft.com/playwright:v1.59.1-noble
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=78f5bba616d1d2df883d8668309336644afd3dc5
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install --frozen-lockfile --ignore-scripts
