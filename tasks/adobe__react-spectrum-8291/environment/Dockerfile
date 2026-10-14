FROM public.ecr.aws/docker/library/node@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=155e361c6e2910c0b087ccba7cc61541fb50b0a7
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack yarn install --immutable
