(() => {
  const globalRegistry = window.customElements;

  try {
    new window.CustomElementRegistry();
    return;
  } catch {
    // Chromium versions without the scoped-registry proposal reject the
    // constructor. The reproduction only needs one page-local registry, so
    // delegate scoped definitions to the page registry in that environment.
  }

  class RegistryShim {
    define(name, constructor, options) {
      const existing = globalRegistry.get(name);
      if (!existing) {
        globalRegistry.define(name, constructor, options);
      }
    }

    get(name) {
      return globalRegistry.get(name);
    }

    whenDefined(name) {
      return globalRegistry.whenDefined(name);
    }

    upgrade(root) {
      return globalRegistry.upgrade?.(root);
    }
  }

  window.CustomElementRegistry = RegistryShim;

  if (!ShadowRoot.prototype.createElement) {
    ShadowRoot.prototype.createElement = function createElement(name, options) {
      return document.createElement(name, options);
    };
  }

  if (!ShadowRoot.prototype.importNode) {
    ShadowRoot.prototype.importNode = function importNode(node, deep) {
      return document.importNode(node, deep);
    };
  }
})();
