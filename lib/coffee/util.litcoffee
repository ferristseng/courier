Token
-----

Generate a random token.

    class Token
      
      @__rand__ = () ->
        Math.random().toString(36).substr(2)

      @generate = () ->
        if not Development
          Token.__rand__() + Token.__rand__()
        else
          'development'

Logger
------

    class Logger

      constructor: (@cls) ->

      log: (msg) ->
        if window.console
          console.log("#{@cls} -> #{msg}")

EventEmitter
------------

    class EventEmitter

      constructor: () ->
        @handlers = {}

      on: (key, handler) ->
        if key not of @handlers
          @handlers[key] = []
        @handlers[key].push(handler)
        @handlers[key].length - 1

      once: (key, handler) ->
        index = @on(key, handler)
        @on(key, () => @handlers[key].splice(index, 2))

      trigger: (key) ->
        @__execute_handlers__.apply(this, arguments)

      __execute_handlers__: (key, data) ->
        if key of @handlers
          n.apply(this, Array.prototype.slice.call(arguments, 1)) for n in @handlers[key]

Put all util objects in the global scope

    window.Token = Token
    window.Logger = Logger
    window.EventEmitter = EventEmitter
