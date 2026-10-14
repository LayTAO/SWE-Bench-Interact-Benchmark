FROM public.ecr.aws/docker/library/node@sha256:c6ae79e38498325db67193d391e6ec1d224d96c693a8a4d943498556716d3783

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=b0118e99853f9785e930fbc3e01f47ce5c43ff79
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export COREPACK_HOME=/corepack; export YARN_ENABLE_GLOBAL_CACHE=true; export YARN_GLOBAL_FOLDER=/yarn-cache; corepack enable && corepack prepare yarn@4.2.2 --activate && yarn install --immutable
