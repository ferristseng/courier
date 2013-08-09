module.exports = (grunt) ->

  grunt.initConfig(
    pkg: grunt.file.readJSON('package.json'),
    uglify:
      options:
        banner: """
                /*
                 * <%= pkg.name %>
                 * <%= pkg.version %>
                 * <%= pkg.author %>
                 * <%= grunt.template.today("yyyy-mm-dd hh:mm") %>
                 */\n
                """
        mangle: false
      compress:
        files:
          'assets/js/courier.min.js': ['lib/js/detect.js',
                                       'lib/js/util.js',
                                       'lib/js/storage.js',
                                       'lib/js/channel.js',
                                       'lib/js/webrtc.js',
                                       'lib/js/p2p.js'],
          'assets/js/client.min.js':  ['lib/js/client.js'],
          'assets/js/host.min.js':    ['lib/js/host.js']
    coffee:
      glob_to_multiple:
        expand: true,
        flatten: true,
        cwd: 'lib/coffee',
        src: ['*.litcoffee'],
        dest: 'lib/js/',
        ext: '.js'
    watch:
      coffee:
        files: 'lib/**/*.litcoffee',
        tasks: ['coffee', 'uglify'],
        options:
          interrupt: true
    nodemon:
      all:
        options:
          file: 'server.js',
          ignored_files: ['node_modules/**', 'package.json'],
          cwd: 'courier-server/'
    concurrent:
      server: ['nodemon', 'watch']
      options:
        logConcurrentOutput: true
    connect:
      server:
        options:
          port: 1337
  )

  grunt.loadNpmTasks('grunt-concurrent')
  grunt.loadNpmTasks('grunt-nodemon')
  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-uglify')

  grunt.registerTask('default', ['coffee', 'uglify'])
  grunt.registerTask('start', ['connect', 'default', 'concurrent'])
