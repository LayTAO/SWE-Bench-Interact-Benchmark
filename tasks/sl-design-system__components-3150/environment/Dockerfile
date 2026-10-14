FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG REPO_URL=https://github.com/sl-design-system/components.git
ARG BASE_COMMIT=946eda3c933c3fe90c460f0645d90cd45e5738b4
ARG NODE_VERSION=22.22.0

USER root
RUN curl -fsSL --retry 3 --retry-all-errors \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
      -o /tmp/node.tar.gz \
  && mkdir -p /opt/node22 \
  && tar -xzf /tmp/node.tar.gz --strip-components=1 -C /opt/node22 \
  && rm /tmp/node.tar.gz
ENV PATH=/opt/node22/bin:${PATH}
ENV FONT_AWESOME_AUTH_TOKEN=unused-for-focused-public-install
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN node .yarn/releases/yarn-4.13.0.cjs workspaces focus \
      @sl-design-system/monorepo \
      @sl-design-system/select \
      @sl-design-system/stylelint-config \
      @sl-design-system/vitest-browser-lit
RUN corepack enable && node .yarn/releases/yarn-4.13.0.cjs workspaces focus @sl-design-system/monorepo @sl-design-system/select @sl-design-system/stylelint-config @sl-design-system/vitest-browser-lit
RUN mkdir -p /opt/harbor-build-tools \
  && cd /opt/harbor-build-tools \
  && npm init -y >/dev/null 2>&1 \
  && npm install --no-save --package-lock=false --ignore-scripts \
       @tokens-studio/sd-transforms@2.0.1 \
       change-case@5.4.3 \
       cssnano@7.1.3 \
       fast-glob@3.3.3 \
       postcss@8.5.8 \
       sass@1.98.0 \
       style-dictionary@5.1.1 \
       stylelint@16.19.1 \
  && mkdir -p /workspace/repo/node_modules/@tokens-studio \
  && ln -s /opt/harbor-build-tools/node_modules/@tokens-studio/sd-transforms /workspace/repo/node_modules/@tokens-studio/sd-transforms \
  && for package in change-case cssnano fast-glob postcss sass style-dictionary stylelint; do \
       ln -s /opt/harbor-build-tools/node_modules/$package /workspace/repo/node_modules/$package; \
     done
RUN node .yarn/releases/yarn-4.13.0.cjs node scripts/build-themes.js --studio \
  && node .yarn/releases/yarn-4.13.0.cjs node scripts/build-styles.js "packages/components/**/*.scss"
