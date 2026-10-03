FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=be8ee165b1ec6a197be0e4247a4359547f95b267
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate && pnpm install --frozen-lockfile
