FROM public.ecr.aws/docker/library/node@sha256:cd59a61258b82b86c1ff0ead50c8a689f6c3483c5ed21036e11ee741add419eb

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

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=f847cd08b59ec7aa42b5f8bdd6b456738b9497ed
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
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
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
# The agent image only needs the locked dependency tree available for the
# interaction workflow.  This historical lockfile's sharp install hook can
# fall back to a native build when GitHub's prebuilt download times out; that
# build requires libvips and is not used by the agent runtime.
RUN export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive --ignore-scripts
