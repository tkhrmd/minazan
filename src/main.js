import storage from './storage';
import querystring from './querystring';

(function() {

  // そのうち書き直す
  let params = querystring.parse(location.search.substr(1));

  if (params.get('minazan') != '1') {
    return;
  }

  let date = new Date();
  let day, end;

  // treat as overtime on the previous day until 10 o'clock
  let overnight = date.getHours() < 10;

  // round minute down to nearest 15 minutes interval
  date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);

  let _date = overnight ? new Date(date.getTime() - 86400000) : date;
  day = _date.getFullYear() * 10000 + (_date.getMonth() + 1) * 100 + _date.getDate();

  end = date.getHours() * 100 + date.getMinutes();
  end += overnight ? 2400 : 0;

  // using querySelector because id is duplicated
  let form = document.getElementById('input_form');
  let textarea = form.querySelector('#model_apply_rsn');
  form.querySelector('#model_out_time_wrk_dvsn_id').value = '1';
  form.querySelector('#model_wrk_day').value = day.toString();
  form.querySelector('#model_strt_time').value = '1900';
  form.querySelector('#model_end_time').value = ('0' + end).slice(-4);
  textarea.placeholder = '入力した内容は保存され、次回から自動的に入力されます。';

  storage.get('reason', val => {
    textarea.value = val || '';
  });

  textarea.addEventListener('blur', function(e) {
    storage.set('reason', this.value);
  });

  let ev = new Event("keyup", {
    "bubbles": true,
    "cancelable": false
  });
  form.querySelector('#model_end_time').dispatchEvent(ev);

}());
