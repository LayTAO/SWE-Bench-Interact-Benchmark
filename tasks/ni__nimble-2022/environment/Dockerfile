FROM mcr.microsoft.com/playwright:v1.42.0-jammy

ARG REPO_URL=https://github.com/ni/nimble.git
ARG BASE_COMMIT=0ac9d81713bf9e91e1d89578cabdbc4db0b67009
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN npm ci \
  && npm run build -w packages/jasmine-parameterized \
  && npm run build -w packages/nimble-tokens \
  && npm run generate-icons -w packages/nimble-components \
  && npm run generate-workers -w packages/nimble-components
