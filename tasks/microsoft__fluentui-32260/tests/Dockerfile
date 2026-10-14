FROM mcr.microsoft.com/playwright:v1.59.1-noble

ARG REPO_URL=https://github.com/microsoft/fluentui.git
ARG BASE_COMMIT=b5e427c24efd04fbd54dd4e43819ddc24be0ac16
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends xvfb libgtk-3-0 libgbm1 libnss3 libasound2t64 && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN printf 'supportedArchitectures:\n  os:\n    - linux\n  cpu:\n    - x64\n  libc:\n    - glibc\n' > .yarnrc.yml \
  && export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive --ignore-engines
RUN env -u CYPRESS_INSTALL_BINARY node node_modules/cypress/bin/cypress install

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
