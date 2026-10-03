FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=80ef0d833d85f3897cfbab2b00291bf85f42e46a

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

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
