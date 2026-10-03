FROM public.ecr.aws/docker/library/node:24-bookworm

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=7ef230221c459a0d8cd31f7a1e202ad4867bdb2f
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && yarn install --immutable
