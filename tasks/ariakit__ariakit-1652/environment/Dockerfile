FROM public.ecr.aws/docker/library/node:16-bullseye

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=b4d916339554f64967ff7c1154b171f319bef28d
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
RUN npm ci --cache /npm-cache --prefer-offline --no-audit --no-fund

ARG DEBIAN_SNAPSHOT=20260831T000000Z
# Bullseye security's live index can reference removed .deb files. Freeze the
# agent image's apt inputs before installing Harbor's setup dependencies.
RUN find /etc/apt -type f \( -name sources.list -o -name '*.list' -o -name '*.sources' \) \
    -exec sed -i \
      -e "s|http://deb.debian.org/debian-security|https://snapshot.debian.org/archive/debian-security/${DEBIAN_SNAPSHOT}|g" \
      -e "s|https://deb.debian.org/debian-security|https://snapshot.debian.org/archive/debian-security/${DEBIAN_SNAPSHOT}|g" \
      -e "s|http://security.debian.org/debian-security|https://snapshot.debian.org/archive/debian-security/${DEBIAN_SNAPSHOT}|g" \
      -e "s|https://security.debian.org/debian-security|https://snapshot.debian.org/archive/debian-security/${DEBIAN_SNAPSHOT}|g" \
      -e "s|https://deb.debian.org/debian|https://snapshot.debian.org/archive/debian/${DEBIAN_SNAPSHOT}|g" \
      -e "s|http://deb.debian.org/debian|https://snapshot.debian.org/archive/debian/${DEBIAN_SNAPSHOT}|g" {} + \
  && printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99swe-bench-snapshot

# Harbor installs these tools before launching Codex. Keep the internally
# consistent curl stack from this immutable Bullseye base instead of allowing
# a moving Debian mirror to select a newer, partially unavailable version.
RUN curl_version="$(dpkg-query -W -f='${Version}' curl)" \
  && printf 'Package: curl libcurl4 libcurl4-openssl-dev\nPin: version %s\nPin-Priority: 1001\n' "$curl_version" > /etc/apt/preferences.d/harbor-agent-deps \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get update -o Acquire::Retries=3 \
  && apt-get install -y --no-install-recommends bash curl ripgrep build-essential git python3 python3-pip \
  && : > /etc/apt/preferences.d/harbor-agent-deps \
  && for package in bash curl libcurl4 libcurl4-openssl-dev ripgrep build-essential git python3 python3-pip; do \
       version="$(dpkg-query -W -f='${Version}' "$package")"; \
       printf 'Package: %s\nPin: version %s\nPin-Priority: 1001\n\n' "$package" "$version" >> /etc/apt/preferences.d/harbor-agent-deps; \
     done \
  && rm -rf /var/lib/apt/lists/*
