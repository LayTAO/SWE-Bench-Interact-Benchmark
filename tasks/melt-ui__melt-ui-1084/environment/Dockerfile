FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG REPO_URL=https://github.com/melt-ui/melt-ui.git
ARG BASE_COMMIT=e682f497894ddd528ea427f2eaaa9014a01934b6
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare pnpm@8.6.3 --activate && pnpm install --frozen-lockfile --ignore-scripts
