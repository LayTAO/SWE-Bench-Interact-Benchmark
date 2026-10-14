FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG INSTALL_COMMIT=6aee49af22267e1dfae14c7c2b3d39397a720e9a

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable \
  && corepack prepare yarn@4.2.2 --activate \
  && yarn install --immutable

# The base image already contains the pinned Chromium used by the evaluator.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
