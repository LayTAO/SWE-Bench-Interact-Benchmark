FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG REPO_URL=https://github.com/melt-ui/melt-ui.git
ARG BASE_COMMIT=bd6ba738da4c3427b2b3fc716ac7730aab8254fb
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@8.6.3 --activate && pnpm install --frozen-lockfile --ignore-scripts
