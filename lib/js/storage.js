(function() {
  var FileStorage, IndexedDBFileStorage, logger,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  logger = new Logger('FileStorage');

  FileStorage = (function() {
    function FileStorage() {}

    FileStorage.prototype.storeChunk = function() {};

    FileStorage.prototype.assembleChunks = function() {};

    FileStorage.prototype.getChunk = function() {};

    FileStorage.prototype.cleanUp = function() {};

    return FileStorage;

  })();

  IndexedDBFileStorage = (function(_super) {
    __extends(IndexedDBFileStorage, _super);

    IndexedDBFileStorage.DB_NAME = 'DownloadFileStorage';

    IndexedDBFileStorage.DB_STORE = 'files';

    function IndexedDBFileStorage() {
      var self;
      self = this;
      this.db = null;
      this.onready = null;
      this.request = indexedDB.open(IndexedDBFileStorage.DB_NAME);
      this.request.onsuccess = function(event) {
        self.db = event.target.result;
        if (self.onready != null) {
          return self.onready();
        }
      };
      this.request.onupgradeneeded = function(event) {
        self.db = event.target.result;
        self.db.createObjectStore(IndexedDBFileStorage.DB_STORE, {
          'keyPath': 'id'
        }).createIndex('name', 'name', {
          unique: false
        });
        if (self.onready != null) {
          return self.onready();
        }
      };
    }

    IndexedDBFileStorage.prototype.getObjectStore = function(type) {
      if (type == null) {
        type = 'read';
      }
      if (this.db) {
        return this.db.transaction([IndexedDBFileStorage.DB_STORE], type).objectStore(IndexedDBFileStorage.DB_STORE);
      }
    };

    IndexedDBFileStorage.prototype.storeChunk = function(chunk, chunk_num, f_name, f_type, onsuccess, onerror) {
      var e, r;
      if (this.db) {
        try {
          r = this.getObjectStore('readwrite').add({
            id: "" + f_name + "_" + chunk_num,
            name: f_name,
            chunk_num: chunk_num,
            data: new Blob([chunk], {
              type: f_type
            })
          });
          r.onsuccess = onsuccess;
          return r.onerror = onerror;
        } catch (_error) {
          e = _error;
          return console.log(e);
        }
      }
    };

    IndexedDBFileStorage.prototype.getChunk = function(chunk_num, f_name, onsuccess, onerror) {
      var e, r;
      if (this.db) {
        try {
          r = this.getObjectStore().get("" + f_name + "_" + chunk_num);
          r.onsuccess = onsuccess;
          return r.onerror = onerror;
        } catch (_error) {
          e = _error;
          return console.log(e);
        }
      }
    };

    IndexedDBFileStorage.prototype.assembleChunks = function(f_name, f_type, onsuccess, onerror) {
      var allChunks, e, r;
      if (this.db) {
        try {
          r = this.getObjectStore().index('name').openCursor(IDBKeyRange.only(f_name));
          allChunks = [];
          return request.onsuccess = function(event) {
            var cursor;
            cursor = event.target.result;
            if (cursor) {
              allChunks.push(cursor.value.data);
              return cursor["continue"]();
            } else {
              return onsuccess(new Blob(allChunks, {
                'type': f_type
              }));
            }
          };
        } catch (_error) {
          e = _error;
          return console.log(e);
        }
      }
    };

    IndexedDBFileStorage.prototype.cleanUp = function() {
      return logger.log('Not yet implemented!');
    };

    return IndexedDBFileStorage;

  })(FileStorage);

  if (isFirefox) {
    window.FileStorage = new IndexedDBFileStorage();
  } else {
    window.FileStorage = void 0;
  }

}).call(this);
