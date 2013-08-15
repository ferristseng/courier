(function() {
  var logger, token;

  window.Development = true;

  logger = new Logger('General');

  token = /http:\/\/.*\?file=([a-z0-9]+).*/.exec(location.href)[1];

  window.P2P = new Client();

  window.P2P.connect(token);

}).call(this);
