FROM mcr.microsoft.com/playwright:v1.52.0-noble
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /subject
RUN apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN npm ci --ignore-scripts --no-audit --no-fund
WORKDIR /workspace/repo

ENV HARBOR_PACKAGE_MANAGER=npm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN if [ ! -e /tooling/node_modules/playwright ] && [ -d /workspace/repo/node_modules/playwright ]; then mkdir -p /tooling/node_modules && ln -s /workspace/repo/node_modules/playwright /tooling/node_modules/playwright; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
