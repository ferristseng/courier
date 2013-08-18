module.exports = (grunt) ->

  grunt.initConfig(
    pkg: grunt.file.readJSON('package.json'),
    env: grunt.option('env') || 'development',

    ###
    
    uglify task
    -----------

    targets:
      development: keep variables, don't compress
      production:  compress, mangle, report

    ###

    uglify:
      all:
        'assets/js/courier.min.js': ['lib/js/detect.js',
                                     'lib/js/util.js',
                                     'lib/js/storage.js',
                                     'lib/js/channel.js',
                                     'lib/js/webrtc.js',
                                     'lib/js/p2p.js'],
        'assets/js/client.min.js':  ['lib/js/client.js'],
        'assets/js/host.min.js':    ['lib/js/host.js']
      options:
        banner: """
                /*
                 * <%= pkg.name %> - javascript
                 * <%= pkg.version %>
                 * <%= pkg.author %>
                 * <%= env %>
                 * <%= grunt.template.today("yyyy-mm-dd hh:mm") %>
                 */\n
                """
      development:
        options:
          beautify: true
          mangle: false
        files: "<%= uglify.all %>"
      production:
        options:
          compress: true
          mangle: true
          report: 'gzip'
        files: "<%= uglify.all %>"

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
      all:
        'assets/css/style.css': ['lib/stylus/*.styl']
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
        files: "<%= stylus.all %>"
      production:
        options:
          compress: true
        files: "<%= stylus.all %>"

    ###
    
    watch (for changes) task
    ------------------------

    targets:
      coffee:
        development: recompile coffeescript, use uglify:development task
        production: recompile coffeescript, use uglify:production task
      css:
        development: recompile stylesheets with stylus:development
        production: recompile stylesheets with stylus:production

    ###

    watch:
      coffee:
        files: ['lib/**/*.litcoffee'],
        tasks: ['coffee', 'uglify:<%= env %>']
      css:
        files: ['lib/**/*.styl', 'lib/**/*.css'],
        tasks: ['stylus:<%= env %>']
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
      server:
        tasks: ['nodemon', 'watch:coffee', 'watch:css']
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

  ###
  
  build tasks

  ###

  grunt.registerTask('build:development', ['coffee', 'uglify:development', 'stylus:development'])
  grunt.registerTask('build:production',  ['coffee', 'uglify:production', 'stylus:production'])
  grunt.registerTask('default',           ['build:development'])

  ###

  service tasks

  ###

  grunt.registerTask('start', ['connect', "build:#{grunt.config.data.env}", 'concurrent:server'])
