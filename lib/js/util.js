(function() {
  var EventEmitter, Logger, Token, logger;

  Token = (function() {
    function Token() {}

    Token.__rand__ = function() {
      return Math.random().toString(36).substr(2);
    };

    Token.generate = function() {
      if (!Development) {
        return Token.__rand__() + Token.__rand__();
      } else {
        return 'development';
      }
    };

    return Token;

  })();

  Logger = (function() {
    function Logger(cls) {
      this.cls = cls;
    }

    Logger.prototype.log = function(msg) {
      if (window.console) {
        return console.log("" + this.cls + " -> " + msg);
      }
    };

    return Logger;

  })();

  logger = new Logger('Util');

  EventEmitter = (function() {
    function EventEmitter() {
      this.handlers = {};
    }

    EventEmitter.prototype.on = function(key, handler) {
      if (!(key in this.handlers)) {
        this.handlers[key] = [];
      }
      this.handlers[key].push(handler);
      return this.handlers[key].length - 1;
    };

    EventEmitter.prototype.once = function(key, handler) {
      var index,
        _this = this;
      index = this.on(key, handler);
      return this.on(key, function() {
        return _this.handlers[key].splice(index, 2);
      });
    };

    EventEmitter.prototype.trigger = function(key) {
      return this.__execute_handlers__.apply(this, arguments);
    };

    EventEmitter.prototype.__execute_handlers__ = function(key, data) {
      var e, n, _i, _len, _ref, _results;
      if (key in this.handlers) {
        _ref = this.handlers[key];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          n = _ref[_i];
          try {
            _results.push(n.apply(this, Array.prototype.slice.call(arguments, 1)));
          } catch (_error) {
            e = _error;
            console.error(e);
            _results.push(logger.log("Failed to run handler (" + key + ") at " + n + "!"));
          }
        }
        return _results;
      }
    };

    return EventEmitter;

  })();

  window.Token = Token;

  window.Logger = Logger;

  window.EventEmitter = EventEmitter;

}).call(this);
