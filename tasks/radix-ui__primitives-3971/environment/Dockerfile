FROM mcr.microsoft.com/playwright:v1.52.0-jammy

ARG REPO_URL=https://github.com/radix-ui/primitives.git
ARG BASE_COMMIT=73f489df31458a3c8ab6cc3789da54b21a63387e
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable \
  && corepack prepare pnpm@11.5.0 --activate \
  && pnpm install --frozen-lockfile
