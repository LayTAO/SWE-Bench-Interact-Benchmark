FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG REPO_URL=https://github.com/floating-ui/floating-ui.git
ARG BASE_COMMIT=ba53ee87e2fb6d0addd99fa8d60b78b85660f847
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate && pnpm install --frozen-lockfile --ignore-scripts
