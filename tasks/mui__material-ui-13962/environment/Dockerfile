FROM public.ecr.aws/docker/library/node:10-buster-slim
RUN find /etc/apt -type f \( -name 'sources.list' -o -name '*.list' \) -exec sed -i -e 's|deb.debian.org/debian|archive.debian.org/debian|g' -e 's|security.debian.org/debian-security|archive.debian.org/debian-security|g' {} + && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99interactrepair-archive && apt-get -o Acquire::Check-Valid-Until=false update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/* /etc/apt/apt.conf.d/99interactrepair-archive

ARG REPO_URL=https://github.com/mui/material-ui.git
ARG BASE_COMMIT=7c29d28ac9ec1cbd5684069f949b00c95dd34fa4
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive
