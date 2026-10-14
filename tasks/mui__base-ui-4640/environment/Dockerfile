FROM mcr.microsoft.com/playwright:v1.59.1-noble
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=84ac4b79743533f5bac9cadcffb7c36bfcb9a5b9
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate && pnpm install --frozen-lockfile --ignore-scripts
