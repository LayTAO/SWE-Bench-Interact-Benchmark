FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV GIT_HTTP_VERSION=HTTP/1.1
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=f7f4794017bd2fd915a6fda1572b28bb147b5e37
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN node .yarn/releases/yarn-4.10.3.cjs install --immutable
