FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=f14ca9b4f17a382cb799360e9aeb52d638ff49ed
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && yarn install --immutable
