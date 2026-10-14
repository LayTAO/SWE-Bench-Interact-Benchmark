FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d

ENV COREPACK_HOME=/corepack

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG INSTALL_COMMIT=1a2b8f860ef2cee6aa579aa6b5e7032ca3be1cb1

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates bash python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable \
  && corepack prepare yarn@4.2.2 --activate \
  && yarn install --immutable

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN mkdir -p /canonical-app \
  && cp /tests/canonical_repro/app/package.json /canonical-app/package.json \
  && node -e "const fs=require('fs'); const p='/canonical-app/package.json'; const v=JSON.parse(fs.readFileSync(p)); delete v.overrides; fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\\n')" \
  && npm install --prefix /canonical-app --no-audit --no-fund --legacy-peer-deps --ignore-scripts
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
