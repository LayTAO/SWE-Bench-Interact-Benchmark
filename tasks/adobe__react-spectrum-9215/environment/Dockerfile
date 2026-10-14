FROM public.ecr.aws/docker/library/node:24-bookworm

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG INSTALL_COMMIT=4c91299dab6579252a9d21029b9ba35c9763ad07

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
# The archived base/ tree is already materialized at INSTALL_COMMIT.  The
# synthetic snapshot created above has no upstream Git history to checkout.
RUN node .yarn/releases/yarn-4.2.2.cjs install --immutable
