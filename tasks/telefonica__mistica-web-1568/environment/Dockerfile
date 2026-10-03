FROM public.ecr.aws/docker/library/node:24-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
ENV GIT_HTTP_VERSION=HTTP/1.1

ARG REPO_URL=https://github.com/Telefonica/mistica-web.git
ARG BASE_COMMIT=602cb838a13013efcf8fdbb0508d3ef7b6b12585

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN node .yarn/releases/yarn-3.6.1.cjs install --immutable
