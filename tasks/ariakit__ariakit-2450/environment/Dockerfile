FROM public.ecr.aws/docker/library/node@sha256:c6ae79e38498325db67193d391e6ec1d224d96c693a8a4d943498556716d3783
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm exec --yes --package=playwright@1.58.2 -- playwright install --with-deps chromium
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=84ec907de4ebe841871cac2b9d2279f6446db606
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN npm ci
