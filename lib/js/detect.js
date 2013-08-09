(function() {
  window.isFirefox = typeof InstallTrigger !== 'undefined';

  window.isChrome = (window.chrome != null) && (window.chrome.webstore != null);

}).call(this);
