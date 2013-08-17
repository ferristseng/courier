FileStorage
-----------

An interface for a method of storing a large file on disk.

    logger = new Logger('FileStorage')

    class FileStorage

      constructor: () ->

Store a part of a file (as a blob) on disk

      storeChunk: () ->

Reassemble the stored chunks into the original file

      assembleChunks: () ->

Get a particular chunk already stored on disk
        
      getChunk: () ->

Clean any stored chunks

      cleanUp: () ->

IndexedDBFileStorage
====================

Use indexedDB to store file chunks (only Firefox supports storing blobs with indexedDB).

    class IndexedDBFileStorage extends FileStorage
      
      @DB_NAME  = 'DownloadFileStorage'
      @DB_STORE = 'files'

      constructor: () ->
        @db       = null
        @onready  = null
        @request  = indexedDB.open(IndexedDBFileStorage.DB_NAME)
        @request.onsuccess = (event) =>
          @db = event.target.result
          @onready() if @onready?
        @request.onupgradeneeded = (event) =>
          @db = event.target.result
          @db.createObjectStore(IndexedDBFileStorage.DB_STORE, { 'keyPath': 'id' })
             .createIndex('name', 'name', { unique: false })
          @onready() if @onready?

      getObjectStore: (type) ->
        type ?= 'read'
        if @db
          @db.transaction([IndexedDBFileStorage.DB_STORE], type)
             .objectStore(IndexedDBFileStorage.DB_STORE)

      storeChunk: (chunk, chunk_num, f_name, f_type, onsuccess, onerror) ->
        if @db
          try
            r = @getObjectStore('readwrite').add({
              id: "#{f_name}_#{chunk_num}",
              name: f_name,
              chunk_num: chunk_num
              data: new Blob([chunk], { type: f_type })
            })
            r.onsuccess = onsuccess
            r.onerror = onerror
          catch e
            console.log(e)

      getChunk: (chunk_num, f_name, onsuccess, onerror) ->
        if @db
          try
            r = @getObjectStore().get("#{f_name}_#{chunk_num}")
            r.onsuccess = onsuccess
            r.onerror = onerror
          catch e
            console.log(e)

      assembleChunks: (f_name, f_type, onsuccess, onerror) ->
        if @db
          try
            r = @getObjectStore().index('name').openCursor(IDBKeyRange.only(f_name))
            allChunks = []
            request.onsuccess = (event) =>
              cursor = event.target.result
              if cursor
                allChunks.push(cursor.value.data)
                cursor.continue()
              else
                onsuccess(new Blob(allChunks, { 'type': f_type }))
          catch e
            console.log(e)

      cleanUp: () ->
        logger.log('Not yet implemented!')

*Set the global FileStorage implementation*
    
    if isFirefox
      window.FileStorage = new IndexedDBFileStorage()
    else
      window.FileStorage = undefined
