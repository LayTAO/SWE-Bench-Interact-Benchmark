FROM public.ecr.aws/docker/library/node:14-bullseye
RUN sed -i 's/deb.debian.org/archive.debian.org/g; s/security.debian.org/archive.debian.org/g' /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null || true \
  && sed -i '/debian-security/s/^/# disabled: /' /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null || true \
  && printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99archive \
  && apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/vuetifyjs/vuetify.git
ARG BASE_COMMIT=7c8b0b4076ec1042c1892cc49f0adc4ce1159472
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
