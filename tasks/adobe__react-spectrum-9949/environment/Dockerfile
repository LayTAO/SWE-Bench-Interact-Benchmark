FROM public.ecr.aws/docker/library/node:24-bookworm

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=c67ecf2954dda1f520fe3c4a68f1c6bc47a597d8
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack yarn install --immutable
