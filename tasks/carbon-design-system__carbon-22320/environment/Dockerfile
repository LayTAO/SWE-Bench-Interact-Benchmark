FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
ARG NODE_VERSION=24.18.0
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/node \
 && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
ENV PATH=/opt/node/bin:$PATH \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
ENV GIT_HTTP_VERSION=HTTP/1.1

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=6d7540d5a22a0c70b3b81bac0733e5abab5e8376
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN node .yarn/releases/yarn-4.10.3.cjs install --immutable

# Ready environment repair: public tools only; keep the buggy source baseline.
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/swe-bench-browsers
ENV PATH=/opt/swe-bench-ready/bin:$PATH
RUN node node_modules/playwright/cli.js install --with-deps chromium
COPY ready/ /opt/swe-bench-ready/
RUN chmod 0755 /opt/swe-bench-ready/bin/yarn
RUN chmod 0755 /opt/swe-bench-ready/*.sh \
 && ln -s /opt/swe-bench-ready/prepare.sh /usr/local/bin/swe-bench-prepare \
 && ln -s /opt/swe-bench-ready/test.sh /usr/local/bin/swe-bench-test \
 && swe-bench-prepare \
 && git diff --exit-code && git diff --cached --exit-code
