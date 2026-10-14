FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

ENV COREPACK_HOME=/corepack

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG INSTALL_COMMIT=1a2b8f860ef2cee6aa579aa6b5e7032ca3be1cb1

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates bash python3 \
  && rm -rf /var/lib/apt/lists/*

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
