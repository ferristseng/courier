var colors    = require('colors');

var Logger    = new function () {
  
  prefixes    = {
    info:     '[info]: '.blue,
    warn:     '[warn]: '.yellow,
    success:  '[success]: '.green,
    error:    '[error]: '.red
  }

  applyPrefix   = function (args, p) {
    args[0] = prefixes[p] + args[0];
    return args;
  }

  this.log      = function () {
    console.log.apply(this, applyPrefix(arguments, 'info'));
  };

  this.info     = function () {
    console.log.apply(this, applyPrefix(arguments, 'info'));
  }

  this.warn     = function () {
    console.warn.apply(this, applyPrefix(arguments, 'warn'));
  };

  this.success  = function () {
    console.log.apply(this, applyPrefix(arguments, 'success'));
  }

  this.error    = function () {
    console.log.error(this, applyPrefix(arguments, 'error'));
  }

}

module.exports = Logger;
