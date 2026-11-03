FROM public.ecr.aws/docker/library/node:20-bookworm

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=10ecdd310a8eaf2e0e7bf21ec522d0c8ff3a6f6b
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack yarn install --immutable

# Ready environment repair: public tools only; keep the buggy source baseline.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/swe-bench-browsers
RUN corepack enable && corepack prepare yarn@4.6.0 --activate
RUN node node_modules/playwright/cli.js install --with-deps chromium
COPY ready/ /opt/swe-bench-ready/
RUN chmod 0755 /opt/swe-bench-ready/*.sh \
 && ln -s /opt/swe-bench-ready/prepare.sh /usr/local/bin/swe-bench-prepare \
 && ln -s /opt/swe-bench-ready/test.sh /usr/local/bin/swe-bench-test \
 && swe-bench-prepare \
 && git diff --exit-code && git diff --cached --exit-code
