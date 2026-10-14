FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=155e361c6e2910c0b087ccba7cc61541fb50b0a7
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack yarn install --immutable

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN if [ -f /tests/canonical_repro/legacy/public/repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts; elif [ -f /tests/canonical_repro/legacy/public/repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
