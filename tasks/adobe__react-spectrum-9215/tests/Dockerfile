FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG INSTALL_COMMIT=4c91299dab6579252a9d21029b9ba35c9763ad07

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
# The archived base/ tree is already materialized at INSTALL_COMMIT.  The
# synthetic snapshot created above has no upstream Git history to checkout.
RUN node .yarn/releases/yarn-4.2.2.cjs install --immutable

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN if [ -f /tests/canonical_repro/legacy/public/repro/app/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/legacy/public/repro/app --no-audit --no-fund; elif [ -f /tests/canonical_repro/legacy/public/repro/app/package.json ]; then npm install --prefix /tests/canonical_repro/legacy/public/repro/app --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
