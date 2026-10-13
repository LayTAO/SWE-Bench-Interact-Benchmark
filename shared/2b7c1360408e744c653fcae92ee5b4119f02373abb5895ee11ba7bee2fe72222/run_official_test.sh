#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
: "${PLAYWRIGHT_BROWSERS_PATH:?set PLAYWRIGHT_BROWSERS_PATH to the pinned server browser cache}"
cd "$SUBJECT_DIR"
link_pnpm_dependency() {
  local dependency="$1"
  local link_path="$SUBJECT_DIR/node_modules/$dependency"
  local target="$SUBJECT_DIR/node_modules/.pnpm/node_modules/$dependency"
  if [[ -e "$link_path" || -L "$link_path" ]]; then
    return 0
  fi
  if [[ ! -e "$target" && ! -L "$target" ]]; then
    return 0
  fi
  mkdir -p "$(dirname "$link_path")"
  ln -s "$target" "$link_path"
}
for dependency in \
  '@floating-ui/react-dom' \
  '@floating-ui/utils' \
  '@testing-library/dom' \
  '@testing-library/react' \
  'aria-query' \
  'chai-dom' \
  'css.escape' \
  'format-util' \
  'lz-string' \
  'picocolors' \
  'pretty-format' \
  'prop-types' \
  'redent' \
  'react' \
  'react-dom' \
  'react-dom/client' \
  'react-dom/test-utils' \
  'reselect' \
  'use-sync-external-store'; do
  link_pnpm_dependency "$dependency"
done
HARBOR_BROWSER_DEPS="$SUBJECT_DIR/.harbor-browser-deps"
mkdir -p "$HARBOR_BROWSER_DEPS"
ESBUILD_BIN="$(find "$SUBJECT_DIR/node_modules/.pnpm" -path '*/esbuild/bin/esbuild' -type f -print -quit 2>/dev/null || true)"
if [[ -z "$ESBUILD_BIN" ]]; then
  echo 'esbuild binary is unavailable for the browser dependency adapter' >&2
  exit 1
fi
bundle_browser_dependency() {
  local source="$1"
  local output="$2"
  shift 2
  "$ESBUILD_BIN" "$source" \
    --bundle \
    --format=esm \
    --platform=browser \
    --target=es2022 \
    --define:process.env.NODE_ENV=\"test\" \
    --outfile="$output" \
    --log-level=error \
    "$@"
}
bundle_browser_dependency node_modules/react/index.js "$HARBOR_BROWSER_DEPS/react.mjs"
bundle_browser_dependency node_modules/react/jsx-runtime.js "$HARBOR_BROWSER_DEPS/react-jsx-runtime.mjs" --external:react
bundle_browser_dependency node_modules/react/jsx-dev-runtime.js "$HARBOR_BROWSER_DEPS/react-jsx-dev-runtime.mjs" --external:react
bundle_browser_dependency node_modules/react-dom/index.js "$HARBOR_BROWSER_DEPS/react-dom.mjs" --external:react
bundle_browser_dependency node_modules/react-dom/client.js "$HARBOR_BROWSER_DEPS/react-dom-client.mjs" --external:react --external:react-dom
bundle_browser_dependency node_modules/react-dom/server.browser.js "$HARBOR_BROWSER_DEPS/react-dom-server.mjs" --external:react
bundle_browser_dependency node_modules/react-dom/test-utils.js "$HARBOR_BROWSER_DEPS/react-dom-test-utils.mjs" --external:react --external:react-dom
USE_SYNC_EXTERNAL_STORE_DIR="$(find "$SUBJECT_DIR/node_modules/.pnpm" -type d -path '*/use-sync-external-store@*/node_modules/use-sync-external-store' -print -quit 2>/dev/null || true)"
if [[ -z "$USE_SYNC_EXTERNAL_STORE_DIR" ]]; then
  echo 'use-sync-external-store package is unavailable for the browser dependency adapter' >&2
  exit 1
fi
bundle_browser_dependency "$USE_SYNC_EXTERNAL_STORE_DIR/shim/index.js" "$HARBOR_BROWSER_DEPS/use-sync-external-store-shim-bundle.mjs" --external:react
bundle_browser_dependency "$USE_SYNC_EXTERNAL_STORE_DIR/shim/with-selector.js" "$HARBOR_BROWSER_DEPS/use-sync-external-store-with-selector-bundle.mjs" --external:react
bundle_browser_dependency node_modules/.pnpm/node_modules/aria-query/lib/index.js "$HARBOR_BROWSER_DEPS/aria-query-bundle.mjs"
cat >"$HARBOR_BROWSER_DEPS/aria-query.mjs" <<'SHIM'
import ariaQuery from './aria-query-bundle.mjs';

export const aria = ariaQuery.aria;
export const dom = ariaQuery.dom;
export const elementRoles = ariaQuery.elementRoles;
export const roleElements = ariaQuery.roleElements;
export const roles = ariaQuery.roles;
export default ariaQuery;
SHIM
bundle_browser_dependency node_modules/.pnpm/node_modules/chai-dom/chai-dom.js "$HARBOR_BROWSER_DEPS/chai-dom.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/css.escape/css.escape.js "$HARBOR_BROWSER_DEPS/css.escape.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/format-util/format.js "$HARBOR_BROWSER_DEPS/format-util.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/prop-types/index.js "$HARBOR_BROWSER_DEPS/prop-types.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/redent/index.js "$HARBOR_BROWSER_DEPS/redent.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/lz-string/libs/lz-string.js "$HARBOR_BROWSER_DEPS/lz-string.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/picocolors/picocolors.browser.js "$HARBOR_BROWSER_DEPS/picocolors.mjs"
bundle_browser_dependency node_modules/.pnpm/node_modules/pretty-format/build/index.js "$HARBOR_BROWSER_DEPS/pretty-format-bundle.mjs"
cat >"$HARBOR_BROWSER_DEPS/pretty-format.mjs" <<'PRETTY_FORMAT_SHIM'
import prettyFormatModule from './pretty-format-bundle.mjs';

const prettyFormat = {
  format: prettyFormatModule.format ?? prettyFormatModule.default,
  plugins: prettyFormatModule.plugins,
  DEFAULT_OPTIONS: prettyFormatModule.DEFAULT_OPTIONS,
};

export const format = prettyFormat.format;
export const plugins = prettyFormat.plugins;
export const DEFAULT_OPTIONS = prettyFormat.DEFAULT_OPTIONS;
export default prettyFormat;
PRETTY_FORMAT_SHIM

# esbuild preserves external CommonJS requires as dynamic require calls.  The
# browser runner has no CommonJS loader, so connect those generated bundles to
# the shared ESM adapters and expose the namespace members used by the tests.
for runtime in react-jsx-runtime react-jsx-dev-runtime; do
  sed -i "1i import ReactAdapter from './react.mjs';" "$HARBOR_BROWSER_DEPS/$runtime.mjs"
  sed -i 's/__require("react")/ReactAdapter/g' "$HARBOR_BROWSER_DEPS/$runtime.mjs"
done
cat >>"$HARBOR_BROWSER_DEPS/react-jsx-runtime.mjs" <<'REACT_JSX_RUNTIME_EXPORTS'
const harborReactJSXRuntime = require_jsx_runtime();
export const Fragment = harborReactJSXRuntime.Fragment;
export const jsx = harborReactJSXRuntime.jsx;
export const jsxs = harborReactJSXRuntime.jsxs;
REACT_JSX_RUNTIME_EXPORTS
cat >>"$HARBOR_BROWSER_DEPS/react-jsx-dev-runtime.mjs" <<'REACT_JSX_DEV_RUNTIME_EXPORTS'
const harborReactJSXDevRuntime = require_jsx_dev_runtime();
export const Fragment = harborReactJSXDevRuntime.Fragment;
export const jsxDEV = harborReactJSXDevRuntime.jsxDEV;
REACT_JSX_DEV_RUNTIME_EXPORTS
sed -i "1i import ReactAdapter from './react.mjs';" "$HARBOR_BROWSER_DEPS/react-dom.mjs"
sed -i 's/var React = __require("react")/var React = ReactAdapter/' "$HARBOR_BROWSER_DEPS/react-dom.mjs"
sed -i "1i import ReactAdapter from './react.mjs';" "$HARBOR_BROWSER_DEPS/react-dom-server.mjs"
sed -i 's/var React = __require("react")/var React = ReactAdapter/g' "$HARBOR_BROWSER_DEPS/react-dom-server.mjs"
for use_sync_bundle in use-sync-external-store-shim-bundle use-sync-external-store-with-selector-bundle; do
  sed -i "1i import ReactAdapter from './react.mjs';" "$HARBOR_BROWSER_DEPS/$use_sync_bundle.mjs"
  sed -i 's/__require("react")/ReactAdapter/g' "$HARBOR_BROWSER_DEPS/$use_sync_bundle.mjs"
done
cat >"$HARBOR_BROWSER_DEPS/use-sync-external-store-shim.mjs" <<'USE_SYNC_SHIM'
import shimModule from './use-sync-external-store-shim-bundle.mjs';

const useSyncExternalStore = shimModule.useSyncExternalStore ?? shimModule.default?.useSyncExternalStore ?? shimModule.default;
export { useSyncExternalStore };
export default { useSyncExternalStore };
USE_SYNC_SHIM
cat >"$HARBOR_BROWSER_DEPS/use-sync-external-store-with-selector.mjs" <<'USE_SYNC_WITH_SELECTOR_SHIM'
import shimModule from './use-sync-external-store-with-selector-bundle.mjs';

const useSyncExternalStoreWithSelector = shimModule.useSyncExternalStoreWithSelector ?? shimModule.default?.useSyncExternalStoreWithSelector ?? shimModule.default;
export { useSyncExternalStoreWithSelector };
export default { useSyncExternalStoreWithSelector };
USE_SYNC_WITH_SELECTOR_SHIM
cat >>"$HARBOR_BROWSER_DEPS/react.mjs" <<'REACT_EXPORTS'
const harborReact = require_react();
export const Children = harborReact.Children;
export const act = harborReact.act;
export const Component = harborReact.Component;
export const Fragment = harborReact.Fragment;
export const Profiler = harborReact.Profiler;
export const PureComponent = harborReact.PureComponent;
export const StrictMode = harborReact.StrictMode;
export const Suspense = harborReact.Suspense;
export const cloneElement = harborReact.cloneElement;
export const createContext = harborReact.createContext;
export const createElement = harborReact.createElement;
export const createRef = harborReact.createRef;
export const forwardRef = harborReact.forwardRef;
export const isValidElement = harborReact.isValidElement;
export const lazy = harborReact.lazy;
export const memo = harborReact.memo;
export const startTransition = harborReact.startTransition;
export const use = harborReact.use;
export const useActionState = harborReact.useActionState;
export const useCallback = harborReact.useCallback;
export const useContext = harborReact.useContext;
export const useDebugValue = harborReact.useDebugValue;
export const useDeferredValue = harborReact.useDeferredValue;
export const useEffect = harborReact.useEffect;
export const useEffectEvent = harborReact.useEffectEvent;
export const useId = harborReact.useId;
export const useImperativeHandle = harborReact.useImperativeHandle;
export const useInsertionEffect = harborReact.useInsertionEffect;
export const useLayoutEffect = harborReact.useLayoutEffect;
export const useMemo = harborReact.useMemo;
export const useOptimistic = harborReact.useOptimistic;
export const useReducer = harborReact.useReducer;
export const useRef = harborReact.useRef;
export const useState = harborReact.useState;
export const useSyncExternalStore = harborReact.useSyncExternalStore;
export const useTransition = harborReact.useTransition;
export const version = harborReact.version;
REACT_EXPORTS
sed -i "1i import ReactAdapter from './react.mjs';\nimport ReactDOMAdapter from './react-dom.mjs';" "$HARBOR_BROWSER_DEPS/react-dom-client.mjs"
sed -i 's/React = __require("react"), ReactDOM = __require("react-dom")/React = ReactAdapter, ReactDOM = ReactDOMAdapter/' "$HARBOR_BROWSER_DEPS/react-dom-client.mjs"
cat >>"$HARBOR_BROWSER_DEPS/react-dom-client.mjs" <<'REACT_DOM_CLIENT_EXPORTS'
const harborReactDOMClient = require_client();
export const createRoot = harborReactDOMClient.createRoot;
export const hydrateRoot = harborReactDOMClient.hydrateRoot;
REACT_DOM_CLIENT_EXPORTS
sed -i "1i import ReactAdapter from './react.mjs';" "$HARBOR_BROWSER_DEPS/react-dom-test-utils.mjs"
sed -i 's/var React = __require("react")/var React = ReactAdapter/' "$HARBOR_BROWSER_DEPS/react-dom-test-utils.mjs"
cat >>"$HARBOR_BROWSER_DEPS/react-dom-test-utils.mjs" <<'REACT_DOM_TEST_UTILS_EXPORTS'
const harborReactDOMTestUtils = require_test_utils();
export const act = ReactAdapter.act ?? harborReactDOMTestUtils.act;
REACT_DOM_TEST_UTILS_EXPORTS
cat >>"$HARBOR_BROWSER_DEPS/react-dom-server.mjs" <<'REACT_DOM_SERVER_EXPORTS'
const harborReactDOMServer = require_server_browser();
export const version = harborReactDOMServer.version;
export const renderToString = harborReactDOMServer.renderToString;
export const renderToStaticMarkup = harborReactDOMServer.renderToStaticMarkup;
export const renderToReadableStream = harborReactDOMServer.renderToReadableStream;
export const resume = harborReactDOMServer.resume;
REACT_DOM_SERVER_EXPORTS
cat >>"$HARBOR_BROWSER_DEPS/react-dom.mjs" <<'REACT_DOM_EXPORTS'
const harborReactDOM = require_react_dom();
export const createPortal = harborReactDOM.createPortal;
export const flushSync = harborReactDOM.flushSync;
export const preconnect = harborReactDOM.preconnect;
export const prefetchDNS = harborReactDOM.prefetchDNS;
export const preload = harborReactDOM.preload;
export const preinit = harborReactDOM.preinit;
export const requestFormReset = harborReactDOM.requestFormReset;
export const unstable_batchedUpdates = harborReactDOM.unstable_batchedUpdates;
export const version = harborReactDOM.version;
REACT_DOM_EXPORTS
CONFIG_FILE="$SUBJECT_DIR/.harbor-vitest.config.mts"
cat >"$CONFIG_FILE" <<'CONFIG'
import { mergeConfig } from 'vitest/config';
import { resolve } from 'node:path';
import baseConfig from './packages/react/vitest.config.mts';

export default mergeConfig(baseConfig, {
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  test: {
    deps: {
      interopDefault: true,
      optimizer: {
        client: {
          enabled: true,
          include: [],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@testing-library/react/pure': resolve(
        process.cwd(),
        'node_modules/@testing-library/react/dist/@testing-library/react.pure.esm.js',
      ),
      '@testing-library/react/pure.js': resolve(
        process.cwd(),
        'node_modules/@testing-library/react/dist/@testing-library/react.pure.esm.js',
      ),
      '@testing-library/dom': resolve(
        process.cwd(),
        'node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js',
      ),
      '@testing-library/react': resolve(
        process.cwd(),
        'node_modules/@testing-library/react/dist/@testing-library/react.esm.js',
      ),
      'react/jsx-runtime': resolve(process.cwd(), '.harbor-browser-deps/react-jsx-runtime.mjs'),
      'react/jsx-dev-runtime': resolve(process.cwd(), '.harbor-browser-deps/react-jsx-dev-runtime.mjs'),
      react: resolve(process.cwd(), '.harbor-browser-deps/react.mjs'),
      'react-dom/client': resolve(process.cwd(), '.harbor-browser-deps/react-dom-client.mjs'),
      'react-dom/server': resolve(process.cwd(), '.harbor-browser-deps/react-dom-server.mjs'),
      'use-sync-external-store/shim/with-selector': resolve(process.cwd(), '.harbor-browser-deps/use-sync-external-store-with-selector.mjs'),
      'use-sync-external-store/shim': resolve(process.cwd(), '.harbor-browser-deps/use-sync-external-store-shim.mjs'),
      'react-dom/test-utils': resolve(process.cwd(), '.harbor-browser-deps/react-dom-test-utils.mjs'),
      'react-dom': resolve(process.cwd(), '.harbor-browser-deps/react-dom.mjs'),
      'aria-query': resolve(process.cwd(), '.harbor-browser-deps/aria-query.mjs'),
      'chai-dom': resolve(process.cwd(), '.harbor-browser-deps/chai-dom.mjs'),
      'css.escape': resolve(process.cwd(), '.harbor-browser-deps/css.escape.mjs'),
      'format-util': resolve(process.cwd(), '.harbor-browser-deps/format-util.mjs'),
      'lz-string': resolve(process.cwd(), '.harbor-browser-deps/lz-string.mjs'),
      picocolors: resolve(process.cwd(), '.harbor-browser-deps/picocolors.mjs'),
      'pretty-format': resolve(process.cwd(), '.harbor-browser-deps/pretty-format.mjs'),
      'prop-types': resolve(process.cwd(), '.harbor-browser-deps/prop-types.mjs'),
      redent: resolve(process.cwd(), '.harbor-browser-deps/redent.mjs'),
    },
  },
});
CONFIG
trap 'rm -f "$CONFIG_FILE"' EXIT
# The selected P2P controls are in this same file. A name filter skips 201 of
# 204 collected tests, so a zero exit code cannot establish their outcomes.
exec env VITEST_ENV=chromium PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" pnpm exec vitest run --config "$CONFIG_FILE" packages/react/src/combobox/root/ComboboxRoot.test.tsx --reporter=json --outputFile="$OUTPUT_FILE" --browser chromium --no-file-parallelism
