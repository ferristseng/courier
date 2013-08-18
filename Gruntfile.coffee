module.exports = (grunt) ->

  grunt.initConfig(
    pkg: grunt.file.readJSON('package.json'),

    ###
    
    uglify task
    -----------

    targets:
      development: keep variables, don't compress
      production:  compress, mangle, report

    ###

    uglify:
      options:
        banner: """
                /*
                 * <%= pkg.name %> - javascript
                 * <%= pkg.version %>
                 * <%= pkg.author %>
                 * <%= grunt.template.today("yyyy-mm-dd hh:mm") %>
                 */\n
                """
      development:
        options:
          beautify: true
          mangle: false
        files:
          'assets/js/courier.min.js': ['lib/js/detect.js',
                                       'lib/js/util.js',
                                       'lib/js/storage.js',
                                       'lib/js/channel.js',
                                       'lib/js/webrtc.js',
                                       'lib/js/p2p.js'],
          'assets/js/client.min.js':  ['lib/js/client.js'],
          'assets/js/host.min.js':    ['lib/js/host.js']
      production:
        options:
          compress: true
          mangle: true
          report: 'gzip'
        files:
          'assets/js/courier.min.js': ['lib/js/detect.js',
                                       'lib/js/util.js',
                                       'lib/js/storage.js',
                                       'lib/js/channel.js',
                                       'lib/js/webrtc.js',
                                       'lib/js/p2p.js'],
          'assets/js/client.min.js':  ['lib/js/client.js'],
          'assets/js/host.min.js':    ['lib/js/host.js']

    ###
    
    coffeescript compile task
    -------------------------

    compile coffeescript to lib/js, where the uglify task will take over

    ###

    coffee:
      glob_to_multiple:
        expand: true,
        flatten: true,
        cwd: 'lib/coffee',
        src: ['*.litcoffee'],
        dest: 'lib/js/',
        ext: '.js'

    ###
    
    stylus compile task
    -------------------
    
    targets:
      development: uncompressed
      production: compressed

    ###

    stylus:
      options:
        banner: """
                /*
                 * <%= pkg.name %> - stylesheet
                 * <%= pkg.version %>
                 * <%= pkg.author %>
                 * <%= grunt.template.today("yyyy-mm-dd hh:mm") %>
                 */\n
                """
        'include css': true
      development:
        files:
          'assets/css/style.css': ['lib/stylus/*.styl']
      production:
        options:
          compress: true
          files:
            'assets/css/style.css': ['lib/stylus/*.styl']

    ###
    
    watch (for changes) task
    ------------------------

    targets:
      development: recompile coffeescript, use uglify:development task
      production: recompile coffeescript, use uglify:production task

    ###

    watch:
      development:
        files: 'lib/**/*.litcoffee',
        tasks: ['coffee', 'uglify:development'],
      production:
        files: 'lib/**/*.litcoffee',
        tasks: ['coffee', 'uglify:production'],
      options:
        interrupt: true

    ###

    nodemon runner task
    -------------------

    restarts the nodejs server on changes

    ###

    nodemon:
      all:
        options:
          file: 'server.coffee',
          ignored_files: ['node_modules/**', 'package.json'],
          cwd: 'courier-server/'

    ###

    concurrent runner task
    ----------------------

    runs certain tasks as daemons to allow them to run simultaneously

    ###

    concurrent:
      development:
        tasks: ['nodemon', 'watch:development']
      production:
        tasks: ['nodemon', 'watch:production']
      options:
        logConcurrentOutput: true

    ###
    
    connect runner task
    -------------------

    runs a static http server on the root directory

    ###

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
  grunt.loadNpmTasks('grunt-contrib-stylus')

  grunt.registerTask('build:development', ['coffee', 'uglify:development'])
  grunt.registerTask('build:production',  ['coffee', 'uglify:production'])
  grunt.registerTask('default',           ['build:development'])
  grunt.registerTask('start:development', ['connect', 'build:development', 'concurrent:development'])
  grunt.registerTask('start:production',  ['connect', 'build:production', 'concurrent:development'])
