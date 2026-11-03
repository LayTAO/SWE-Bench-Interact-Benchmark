FROM public.ecr.aws/docker/library/node:22-bookworm
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

# Ready environment repair: public tools only; keep the buggy source baseline.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/swe-bench-browsers
RUN node node_modules/playwright/cli.js install --with-deps chromium
COPY ready/ /opt/swe-bench-ready/
RUN chmod 0755 /opt/swe-bench-ready/*.sh \
 && ln -s /opt/swe-bench-ready/prepare.sh /usr/local/bin/swe-bench-prepare \
 && ln -s /opt/swe-bench-ready/test.sh /usr/local/bin/swe-bench-test \
 && swe-bench-prepare \
 && git diff --exit-code && git diff --cached --exit-code
