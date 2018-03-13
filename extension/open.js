chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.create({
    url: 'https://minagine.awg.co.jp/hcm/work/outtimewrkapplymngmnt?do=show_input_new&minazan=1',
  });
});
