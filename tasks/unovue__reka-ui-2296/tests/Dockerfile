FROM mcr.microsoft.com/playwright:v1.58.2-noble
ENV COREPACK_HOME=/corepack
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/unovue/reka-ui.git
ARG BASE_COMMIT=178e6cdd787858552a3f9700dc2ba8ee9b9201e5
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
RUN export COREPACK_HOME=/corepack; corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro.tar /tmp/canonical_repro.tar
RUN rm -rf /tests/canonical_repro \
  && tar -xf /tmp/canonical_repro.tar -C /tests \
  && rm /tmp/canonical_repro.tar
COPY verifier.tar /tmp/verifier.tar
RUN rm -rf /tests/verifier \
  && tar -xf /tmp/verifier.tar -C /tests \
  && rm /tmp/verifier.tar
RUN for tooling_dir in /tests/canonical_repro/tooling /tests/canonical_repro/legacy/public/repro/tooling; do if [ -f "$tooling_dir/package-lock.json" ]; then npm ci --prefix "$tooling_dir" --no-audit --no-fund; elif [ -f "$tooling_dir/package.json" ]; then npm install --prefix "$tooling_dir" --no-audit --no-fund; fi; done
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
