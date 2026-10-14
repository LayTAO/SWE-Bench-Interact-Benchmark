FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
RUN mkdir -p /opt/accepted-node && curl -fsSL https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-x64.tar.gz -o /opt/accepted-node/node-v24.14.1-linux-x64.tar.gz && echo 'ace9fa104992ed0829642629c46ca7bd7fd6e76278cb96c958c4b387d29658ea  /opt/accepted-node/node-v24.14.1-linux-x64.tar.gz' | sha256sum --check - && tar -xzf /opt/accepted-node/node-v24.14.1-linux-x64.tar.gz -C /opt/accepted-node && rm /opt/accepted-node/node-v24.14.1-linux-x64.tar.gz
ENV PATH="/opt/accepted-pnpm/bin:/opt/accepted-node/node-v24.14.1-linux-x64/bin:${PATH}"
ENV COREPACK_ENABLE_PROJECT_SPEC=0 npm_config_manage_package_manager_versions=false pnpm_config_manage_package_manager_versions=false pnpm_config_pm_on_fail=ignore
RUN npm install --global --prefix /opt/accepted-pnpm --ignore-scripts --no-audit --no-fund pnpm@11.5.2 && test "$(node --version)" = "v24.14.1" && test "$(pnpm --version)" = "11.5.2"
ARG REPO_URL=https://github.com/mui/base-ui.git
ARG BASE_COMMIT=d5a03c8f1ae4e91d1cb02c0ea34daf2f7c0ed21d
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN pnpm install --frozen-lockfile --ignore-scripts && test "$(node --version)" = "v24.14.1" && test "$(pnpm --version)" = "11.5.2"

RUN pnpm --filter @base-ui/utils build
RUN npm install --prefix /opt/accepted-browser-installer --ignore-scripts --no-audit --no-fund playwright-core@1.57.0 && PLAYWRIGHT_BROWSERS_PATH=/ms-playwright node /opt/accepted-browser-installer/node_modules/playwright-core/cli.js install chromium --only-shell
ENV HARBOR_ACCEPTED_CHROMIUM_EXECUTABLE=/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell
ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
RUN npm install --prefix /opt/canonical-tooling --no-audit --no-fund --ignore-scripts @playwright/test@1.58.2 vite@5.4.21 @vitejs/plugin-react@4.7.0
RUN PLAYWRIGHT_BROWSERS_PATH=/ms-playwright /opt/canonical-tooling/node_modules/.bin/playwright install chromium
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh
