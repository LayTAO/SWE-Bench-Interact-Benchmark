FROM public.ecr.aws/docker/library/node:20-bookworm
ARG REPO_URL=https://github.com/motiondivision/motion.git
ARG BASE_COMMIT=fa398ade6d882d488e8db9b22e25aff71672b6a3
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && corepack prepare yarn@3.6.4 --activate && yarn install --immutable
