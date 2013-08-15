Settings

    window.Development = true

Setup a general logger

    logger = new Logger('General')

Setup some UI elements
    
    fileForm            = $('#file')
    fileInfoSection     = $('#info')
    fileProgressSection = $('#progress')
    connectionsSection  = $('#connections')
    fileNameData        = $('#info #filename-val')
    fileTypeData        = $('#info #type-val')
    fileSizeData        = $('#info #size-val')
    fileChunksData      = $('#info #chunks-val')
    downloadUrlForm     = $('#download #url')

Initialize the P2P member

    window.P2P = new Host()

When the storage is ready, enable the file form.

    P2P.on('storageReady', () -> fileForm.attr('disabled', false))

When the user attaches a file, ready the host

    fileForm.on('change', (event) ->
      file = P2P.host(event.target.files[0])
      fileForm.attr('disabled', true)
      fileNameData.html(file.name)
      fileTypeData.html(file.type)
      fileSizeData.html("#{file.size} bytes")
      fileChunksData.html(file.chunks)
      fileInfoSection.show()
      P2P.on('readProgress', (r, c) -> fileProgressSection.html("#{r} / #{c}"))
      P2P.on('fileEnd', (f, t) ->
        downloadUrlForm.val("#{window.location.protocol}//#{window.location.host}/download.html?file=#{t}")))
