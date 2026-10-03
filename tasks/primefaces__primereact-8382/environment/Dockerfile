FROM public.ecr.aws/docker/library/node:20-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/primefaces/primereact.git
ARG BASE_COMMIT=f237f286f2968b79f08c3b7450f74d2295bb8cdf
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN npm ci --ignore-scripts --no-audit --no-fund
