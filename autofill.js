(function() {

  // そのうち書き直す

  // parse query string
  class Params {
    constructor() {
      this._params = {};
      location.search.substr(1).split('&').forEach(param => {
        let [key, val] = param.split('=');
        this._params[key] = decodeURIComponent(val);
      });
    }
    get(key) {
      return this._params[key];
    }
  }

  let params = new Params();
  if (params.get('minazan') != '1') {
    return;
  }

  let date = new Date();
  let day, end;

  // treat as overtime on the previous day until 10 o'clock
  let overnight = date.getHours() < 10;

  // round up the time in 15 minute increments
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15);

  let _date = overnight ? new Date(date.getTime() - 86400000) : date;
  day = _date.getFullYear() * 10000 + (_date.getMonth() + 1) * 100 + _date.getDate();

  end = date.getHours() * 100 + date.getMinutes();
  end += overnight ? 2400 : 0;

  // use querySelector instead of getElementById
  // because it is a fxxxin' html whose id is duplicated
  let form = document.getElementById('input_form');
  let textarea = form.querySelector('#model_apply_rsn');
  form.querySelector('#model_out_time_wrk_dvsn_id').value = '1';
  form.querySelector('#model_wrk_day').value = day.toString();
  form.querySelector('#model_strt_time').value = '1900';
  form.querySelector('#model_end_time').value = ('0' + end).slice(-4);
  textarea.placeholder = '入力した内容は保存され、次回から自動的に入力されます。';

  chrome.storage.local.get(['reason'], val => {
    textarea.value = val['reason'] || '';
  });

  textarea.addEventListener('blur', function(e) {
    chrome.storage.local.set({
      'reason': this.value,
    }, function() {});
  });

}());
