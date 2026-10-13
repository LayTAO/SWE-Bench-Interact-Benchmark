import { fileURLToPath } from 'node:url';
import path from 'node:path';

const subjectDirectory = process.env.SUBJECT_DIR;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));

if (!subjectDirectory || !path.isAbsolute(subjectDirectory)) {
  throw new Error('SUBJECT_DIR must be an absolute path');
}

const styleByFile = {
  'listbox.scss.js': `:host { align-items: stretch; display: flex; flex-direction: column; gap: 2px; max-block-size: var(--sl-popover-max-block-size, 190px); min-block-size: 0; overflow: auto; padding: 8px 0; scrollbar-width: thin; }`,
  'select.scss.js': `:host { display: inline-flex; max-inline-size: 100%; position: relative; vertical-align: middle; } sl-listbox { background: white; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; display: none; margin: 0; opacity: 0; } sl-listbox:popover-open { display: flex; opacity: 1; }`,
  'select-button.scss.js': `:host { align-items: center; background: white; border: 1px solid #64748b; border-radius: 6px; color: #0f172a; cursor: pointer; display: inline-flex; flex-grow: 1; min-inline-size: 0; padding: 8px 12px; } .wrapper { flex: 1; overflow: hidden; white-space: nowrap; }`,
  'option.scss.js': `:host { color: #0f172a; display: block; inline-size: calc(100% - 16px); margin-inline: 8px; user-select: none; } [part='container'] { align-items: center; border-radius: 4px; cursor: pointer; display: flex; padding: 6px 8px; }`,
  'option-group.scss.js': `:host { display: flex; inline-size: 100%; }`,
  'option-group-header.scss.js': `:host { display: block; padding: 6px 8px; }`,
  'icon.scss.js': `:host { display: inline-grid; flex-shrink: 0; inline-size: 1rem; place-content: center; }`,
  'button.scss.js': `:host { align-items: center; cursor: pointer; display: inline-flex; }`
};

const sourceStylePlugin = {
  name: 'interactrepair-sl-source-style-shims',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!source.endsWith('.scss.js')) return null;
    const resolved = source.startsWith('@subject/')
      ? path.resolve(subjectDirectory, source.slice('@subject/'.length))
      : path.resolve(path.dirname(importer || subjectDirectory), source);
    return `${resolved}?sl-source-style`;
  },
  load(id) {
    if (!id.endsWith('?sl-source-style')) return null;
    const filename = path.basename(id.slice(0, -'?sl-source-style'.length));
    const css = styleByFile[filename] || ':host { display: block; }';
    return `import { css } from 'lit'; export default css\`${css}\`;`;
  }
};

export default {
  root: appDirectory,
  plugins: [sourceStylePlugin],
  resolve: {
    alias: [{ find: '@subject', replacement: subjectDirectory }]
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    fs: { allow: [subjectDirectory, appDirectory] }
  }
};
