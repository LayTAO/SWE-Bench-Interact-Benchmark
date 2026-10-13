export const FeatureFlags = {
  enabled: () => false,
};

export const createScope = (flags = {}) => ({
  enabled: (flag) => Boolean(flags[flag]),
  mergeWithScope() {},
});

export const notifyAvailableFlag = () => {};
