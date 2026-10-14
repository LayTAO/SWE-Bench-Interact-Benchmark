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

ARG REPO_URL=https://github.com/angular/components.git
ARG BASE_COMMIT=8eab22fae4d49392ab095a03140d9a1b02c1fa1e
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
RUN yarn install --frozen-lockfile --non-interactive --ignore-scripts
