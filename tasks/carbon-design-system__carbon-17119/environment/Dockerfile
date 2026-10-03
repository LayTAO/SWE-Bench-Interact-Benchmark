FROM public.ecr.aws/docker/library/node:20-bookworm

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=10ecdd310a8eaf2e0e7bf21ec522d0c8ff3a6f6b
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack yarn install --immutable
