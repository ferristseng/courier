Courier
-------

A browser-based file sharing application built with WebRTC and Websockets.

Supports one-to-many distribution system.

Components
----------

There is a server component in `courier-server/` that coordinates the WebRTC handshaking protocol between the person hosting the file, and the clients.

The client-side scripts are located in `lib/coffee/`.

Stylesheets are located in `lib/stylus/`.

Installing
----------

Run `npm install` to install dependencies. You also need [grunt-cli](https://github.com/gruntjs/grunt-cli) to test the app locally. Run `grunt start` to compile the assets and to start the static server and websocket server.

To change the environment to production, use `grunt start --env production`.
