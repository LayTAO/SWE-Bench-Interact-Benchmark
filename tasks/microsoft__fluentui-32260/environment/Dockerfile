FROM public.ecr.aws/docker/library/node:20-bookworm

ARG REPO_URL=https://github.com/microsoft/fluentui.git
ARG BASE_COMMIT=b5e427c24efd04fbd54dd4e43819ddc24be0ac16
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends chromium xvfb libgtk-3-0 libgbm1 libnss3 libasound2 && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN printf 'supportedArchitectures:\n  os:\n    - linux\n  cpu:\n    - x64\n  libc:\n    - glibc\n' > .yarnrc.yml \
  && export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive
RUN env -u CYPRESS_INSTALL_BINARY node node_modules/cypress/bin/cypress install
