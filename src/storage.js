const get = (key, callback) => {
  chrome.storage.local.get([key], items => callback(items[key]));
};

const set = (key, val, callback) => {
  chrome.storage.local.set({
    [key]: val,
  }, callback);
};

export default {
  get,
  set,
};
