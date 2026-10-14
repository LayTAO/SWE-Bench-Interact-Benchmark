FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/unovue/reka-ui.git
ARG BASE_COMMIT=d3df6924e3892d6ebded7000efdaf3fce1f8f7ae

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN pnpm install --frozen-lockfile

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
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN mkdir -p /opt/reka-canonical-cache/app /opt/reka-canonical-cache/npm \
  && cp /tests/canonical_repro/legacy/public/repro/app/package.json /opt/reka-canonical-cache/app/package.json \
  && pnpm --filter reka-ui build-only \
  && (cd /workspace/repo/packages/core && npm pack --ignore-scripts --pack-destination /opt/reka-canonical-cache/app) \
  && mv /opt/reka-canonical-cache/app/reka-ui-*.tgz /opt/reka-canonical-cache/app/subject.tgz \
  && npm_config_cache=/opt/reka-canonical-cache/npm npm install --prefix /opt/reka-canonical-cache/app --legacy-peer-deps --no-audit --no-fund
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
