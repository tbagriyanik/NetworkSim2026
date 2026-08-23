const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'typescript') {
    try {
      return originalLoad.call(this, 'typescript-v6', parent, isMain);
    } catch {
      // Fallback to original request
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};
