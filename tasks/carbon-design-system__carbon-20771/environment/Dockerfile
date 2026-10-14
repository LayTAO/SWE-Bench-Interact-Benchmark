FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
ARG NODE_VERSION=22.23.1
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/node \
 && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
ENV PATH=/opt/node/bin:$PATH \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
ENV GIT_HTTP_VERSION=HTTP/1.1

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=925b746d92d72f9c9cf3fa3434843d049d630680
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN node .yarn/releases/yarn-4.10.3.cjs install --immutable
