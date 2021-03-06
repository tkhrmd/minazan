class Mux {
  constructor(path) {
    this.path = path;
    this.map = new Map();
  }
  handle(pattern, handler) {
    this.map.set(pattern, handler);
  }
  dispatch() {
    for (const [pattern, handler] of this.map) {
      if (this.path == pattern) {
        return handler();
      }
    }
  }
}

class Overtime {
  constructor(datetime) {
    const date = datetime ? this._parse(datetime) : new Date();
    date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);

    // 12時までは前日の残業とみなす
    let time = 0;
    if (date.getHours() < 12) {
      date.setDate(date.getDate() - 1);
      time += 2400;
    }

    this.date = 10000 * date.getFullYear() + 100 * (date.getMonth() + 1) + date.getDate();
    this.time = time + 100 * date.getHours() + date.getMinutes();
  }
  getDate() {
    return this.date;
  }
  getTime() {
    return this.time;
  }
  getDatetime() {
    return 10000 * this.date + this.time;
  }
  _parse(yyyymmddhhmm) {
    return new Date(
      Math.floor(yyyymmddhhmm / Math.pow(10, 8)),
      Math.floor(yyyymmddhhmm / Math.pow(10, 6)) % 100 - 1,
      Math.floor(yyyymmddhhmm / Math.pow(10, 4)) % 100,
      Math.floor(yyyymmddhhmm / Math.pow(10, 2)) % 100,
      yyyymmddhhmm % 100
    );
  }
}

const querystring = {
  stringify: (obj) => {
    const params = [];
    for (const [key, val] of Object.entries(obj)) {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    }
    return params.join('&');
  },
  parse: (str) => {
    const params = new Map();
    for (const param of str.split('&')) {
      const [key, val] = param.split('=');
      if (val == undefined) continue;
      params.set(decodeURIComponent(key), decodeURIComponent(val));
    }
    return params;
  },
};

const storage = {
  get: (key, callback) => {
    chrome.storage.local.get([key], items => callback(items[key]));
  },
  set: (key, val, callback) => {
    chrome.storage.local.set({
      [key]: val,
    }, callback);
  },
};

const timecardHandler = () => {

  const table = document.getElementById('table_wrktimesht');
  const regexDay = /\d{1,2}/;
  for (const row of table.rows) {

    const first = row.firstElementChild;
    const last = row.lastElementChild;

    // ヘッダ行
    if (first.innerText == '日') {
      last.classList.add('sp_r');
      last.insertAdjacentHTML('afterend', '<th rowspan="3" class="center sp_l">残業申請</th>');
      continue;
    }
    if (first.innerText == '合計') {
      last.classList.add('sp_r');
      last.insertAdjacentHTML('afterend', '<td class="center sp_l">-</td>');
      continue;
    }
    if (first.innerText == '' && first == last) {
      last.setAttribute('colspan', parseInt(last.getAttribute('colspan')) + 1);
      continue;
    }
    if (!regexDay.test(first.innerText)) {
      continue;
    }

    // 以降はタイムカード行
    last.classList.add('sp_r');

    const date = parseInt(row.querySelector('[id^=model_][id$=_wrk_day]').value);
    const plannedEndTime = parseInt(row.querySelector('[id^=_model_][id$=_pln_wrk_end_time]').value);
    const endTime = parseInt(row.querySelector('[id^=model_][id$=_wrk_end_apply_time]').value);

    // 出社日ではない
    if (!plannedEndTime) {
      last.insertAdjacentHTML('afterend', '<td class="center label_sts sp_l"></td>');
      continue;
    }
    // 退勤していない
    if (!endTime) {
      last.insertAdjacentHTML('afterend', '<td class="center sp_l"></td>');
      continue;
    }
    // 残業申請済み
    if (row.querySelector('[title^=平日残業]')) {
      last.insertAdjacentHTML('afterend', '<td class="center sp_l">申請済</td>');
      continue;
    }

    const planned = new Overtime(date * 10000 + plannedEndTime);
    const overtime = new Overtime(date * 10000 + endTime);

    // 残業申請の必要がない
    if (overtime.getDatetime() <= planned.getDatetime()) {
      last.insertAdjacentHTML('afterend', '<td class="center sp_l"></td>');
      continue;
    }

    // 残業申請リンクを表示
    const params = {
      'do': 'show_input_new',
      'minazan': 1,
      'datetime': overtime.getDatetime(),
    };
    const url = '/work/outtimewrkapplymngmnt?' + querystring.stringify(params);
    last.insertAdjacentHTML('afterend', `<td class="center sp_l"><a href="${url}">未申請</a></td>`);
  }
};

const applicationFormHandler = () => {
  const params = querystring.parse(location.search.substr(1));

  if (params.get('minazan') != 1) {
    return;
  }

  const overtime = new Overtime(params.get('datetime'));

  const form = document.getElementById('input_form');
  form.querySelector('#model_out_time_wrk_dvsn_id').value = 1;
  form.querySelector('#model_wrk_day').value = overtime.getDate();

  const startTime = form.querySelector('#model_strt_time');
  const startTimeKey = 'start_time';
  storage.get(startTimeKey, val => startTime.value = val || 1900);
  startTime.addEventListener('blur', e => storage.set(startTimeKey, startTime.value));

  const endTime = form.querySelector('#model_end_time');
  endTime.value = overtime.getTime();

  // なぜ
  setTimeout(() => {
    const event = document.createEvent('HTMLEvents');
    event.initEvent('keyup', false, true);
    endTime.dispatchEvent(event);
  }, 10);

  const reason = form.querySelector('#model_apply_rsn');
  const reasonKey = 'reason';
  storage.get(reasonKey, val => reason.value = val || '');
  reason.addEventListener('blur', e => storage.set(reasonKey, reason.value));
  reason.placeholder = '入力した内容は保存され、次回から自動的に入力されます。';
};

const mux = new Mux(location.pathname);
mux.handle('/work/wrktimemngmntshtself/sht', timecardHandler);
mux.handle('/work/outtimewrkapplymngmnt', applicationFormHandler);
mux.dispatch();
