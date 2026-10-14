FROM public.ecr.aws/docker/library/node:22-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/unovue/reka-ui.git
ARG BASE_COMMIT=c215ca6cf92fb0fbebe5821b5ad3597071d4c49f

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN pnpm install --frozen-lockfile
