FROM public.ecr.aws/docker/library/node:22-bookworm
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm exec --yes --package=playwright@1.58.2 -- playwright install --with-deps chromium
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/angular/components.git
ARG BASE_COMMIT=c71256dfdb981a628120d6bbafdc3001836dd9a8
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && pnpm install --frozen-lockfile
