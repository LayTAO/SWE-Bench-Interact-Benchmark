FROM public.ecr.aws/docker/library/node:22-bookworm
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm exec --yes --package=playwright@1.58.2 -- playwright install --with-deps chromium
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/angular/components.git
ARG BASE_COMMIT=c71256dfdb981a628120d6bbafdc3001836dd9a8
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && pnpm install --frozen-lockfile

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm exec --yes --package=playwright@1.58.2 -- playwright install --with-deps chromium
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome
RUN apt-get update \
  && apt-get install -y --no-install-recommends patch \
  && rm -rf /var/lib/apt/lists/*
RUN cd /workspace/repo \
  && BAZELISK_HOME=/workspace/repo/node_modules/.cache/bazelisk \
     pnpm exec bazel \
       --output_base=/workspace/repo/node_modules/.cache/bazel-output \
       fetch \
         //src/dev-app:devserver \
         //src/material/sidenav:unit_tests_chromium
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install \
  --prefix /tests/canonical_repro/legacy/public/repro/tooling \
  --no-audit --no-fund --ignore-scripts
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh \
  /tests/canonical_repro/legacy/public/repro/scripts/*.sh

ENV HARBOR_PACKAGE_MANAGER=pnpm
RUN ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
