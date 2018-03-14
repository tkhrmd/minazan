// either Object or Map
const stringify = (obj) => {
  let arr = [];
  for (let [key, val] of Object.entries(obj)) {
    arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
  }
  return arr.join('&');
};

const parse = (str) => {
  let map = new Map();
  for (let pair of str.split('&')) {
    let [key, val] = pair.split('=');
    if (val == undefined) {
      continue;
    }
    map.set(decodeURIComponent(key), decodeURIComponent(val));
  }
  return map;
};

export default {
  stringify,
  parse,
};
