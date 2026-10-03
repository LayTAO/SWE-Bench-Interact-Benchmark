FROM mcr.microsoft.com/playwright:v1.58.2-noble
ENV GIT_HTTP_VERSION=HTTP/1.1
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=4e5b1c21648df3bad0811615f2fc82b150c56a25
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate && pnpm install --frozen-lockfile --ignore-scripts
