FROM mcr.microsoft.com/playwright:v1.58.2-noble
ENV DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/angular/components.git
ARG BASE_COMMIT=8eab22fae4d49392ab095a03140d9a1b02c1fa1e
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN yarn install --frozen-lockfile --non-interactive --ignore-engines --ignore-scripts
# Keep Bazel 5.0.0 available to the nested no-network reproduction runner.
RUN BAZELISK_HOME=/workspace/repo/node_modules/.cache/bazelisk yarn --ignore-engines -s bazel --version

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
ARG NODE_VERSION=16.14.0
RUN curl -fsSLo /tmp/node.tar.gz \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
  && echo "2c69e7b040c208b61ebf9735c63d2e5bcabfed32ef05a9b8dd5823489ea50d6b  /tmp/node.tar.gz" | sha256sum -c - \
  && tar -xzf /tmp/node.tar.gz -C /opt \
  && rm /tmp/node.tar.gz
ENV PATH="/opt/node-v16.14.0-linux-x64/bin:${PATH}"
RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc \
  && rm -rf /var/lib/apt/lists/*
RUN BAZELISK_HOME=/workspace/repo/node_modules/.cache/bazelisk \
  yarn --ignore-engines -s bazel --version
# ShellJS 0.8.5 can lose the stdin pipe while the Bazel-managed yarn_install
# repository rule runs the legacy postinstall patch. Use Node's synchronous
# child-process API for the same `patch -p0` operation so dependency fetching is
# deterministic without changing the checked-out production source.
RUN sed -i "/const fs = require('fs');/a const childProcess = require('child_process');" \
      /workspace/repo/tools/postinstall/apply-patches.js \
  && sed -i "s#  shelljs.cat(patchFile).exec('patch -p0');#  childProcess.execFileSync('git', ['apply', '--unsafe-paths', '-p0', patchFile], {stdio: 'inherit'});#" \
      /workspace/repo/tools/postinstall/apply-patches.js
COPY canonical_repro/ /tests/canonical_repro/
RUN git -C /workspace/repo apply \
      /tests/canonical_repro/legacy/public/repro/app/fixture.patch \
  && BAZELISK_HOME=/workspace/repo/node_modules/.cache/bazelisk \
     yarn --ignore-engines -s bazel \
       --output_base=/workspace/repo/node_modules/.cache/bazel-output \
       fetch \
         //src/dev-app:interactrepair-25077-devserver \
         @esbuild_linux_amd64//:bin/esbuild \
  && BAZELISK_HOME=/workspace/repo/node_modules/.cache/bazelisk \
     yarn --ignore-engines -s bazel \
       --output_base=/workspace/repo/node_modules/.cache/bazel-output \
       build //src/cdk/scrolling:unit_tests_chromium \
  && git -C /workspace/repo apply --reverse \
      /tests/canonical_repro/legacy/public/repro/app/fixture.patch \
  && git -C /workspace/repo checkout -- tools/postinstall/apply-patches.js
COPY test.sh /tests/test.sh
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh \
  /tests/canonical_repro/legacy/public/repro/scripts/*.sh
