FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/tailwindlabs/headlessui.git
ARG BASE_COMMIT=a12f9f245f7a7a3baca1c52e25fd05642a0e11e8
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
RUN npm install --cache /npm-cache --prefer-offline --no-audit --no-fund --package-lock=false

ENV HARBOR_PACKAGE_MANAGER=npm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN for tooling_dir in /tests/canonical_repro/tooling /tests/canonical_repro/legacy/public/repro/tooling; do if [ -f "$tooling_dir/package-lock.json" ]; then npm ci --prefix "$tooling_dir" --no-audit --no-fund; elif [ -f "$tooling_dir/package.json" ]; then npm install --prefix "$tooling_dir" --no-audit --no-fund; fi; done
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
