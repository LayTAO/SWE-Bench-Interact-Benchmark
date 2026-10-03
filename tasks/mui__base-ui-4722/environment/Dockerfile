FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=fb4729f9d239e43eac87b94437bfd490c8ab5a0a
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate && pnpm install --frozen-lockfile --ignore-scripts
