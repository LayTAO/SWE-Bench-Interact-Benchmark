FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=77b3442e4150116f3d35995b5a98b582d9e6f231
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && yarn install --immutable

# Ready environment repair: public tools only; keep the buggy source baseline.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/swe-bench-browsers
RUN node node_modules/playwright/cli.js install --with-deps chromium
COPY ready/ /opt/swe-bench-ready/
RUN chmod 0755 /opt/swe-bench-ready/*.sh \
 && ln -s /opt/swe-bench-ready/prepare.sh /usr/local/bin/swe-bench-prepare \
 && ln -s /opt/swe-bench-ready/test.sh /usr/local/bin/swe-bench-test \
 && swe-bench-prepare \
 && git diff --exit-code && git diff --cached --exit-code
