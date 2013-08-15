(function() {
  var EventEmitter, Logger, Token, logger,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
      if (__indexOf.call(this.handlers, key) < 0) {
        this.handlers[key] = [];
      }
      return this.handlers[key].push(handler) - 1;
    };

    EventEmitter.prototype.once = function(key, handler) {
      var index;
      index = this.on(key, handler);
      return this.on(key, function() {
        return this.handlers[key].splice(index, 2);
      });
    };

    EventEmitter.prototype.trigger = function(key) {
      logger.log("Triggered " + key + "!");
      return this.__execute_handlers__.apply(this, arguments);
    };

    EventEmitter.prototype.__execute_handlers__ = function(key, data) {
      var n, _i, _len, _ref, _results;
      if (key in this.handlers) {
        _ref = this.handlers[key];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          n = _ref[_i];
          _results.push(n.apply(this, Array.prototype.slice.call(arguments, 1)));
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
