Setup a general logger

    logger = new Logger('General')

Setup some UI elements

Get the Token from the URL

    token = /http:\/\/.*\?file=([a-z0-9]+).*/.exec(location.href)[1]

Initialize the P2P member

    window.P2P = new Client()

Try to initialize the connection to the host

    window.P2P.connect(token)
