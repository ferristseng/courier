(function() {
  var connectionsSection, downloadUrlForm, fileChunksData, fileForm, fileInfoSection, fileNameData, fileProgressSection, fileSizeData, fileTypeData, logger;

  window.Development = true;

  logger = new Logger('General');

  fileForm = $('#file');

  fileInfoSection = $('#info');

  fileProgressSection = $('#progress');

  connectionsSection = $('#connections');

  fileNameData = $('#info #filename-val');

  fileTypeData = $('#info #type-val');

  fileSizeData = $('#info #size-val');

  fileChunksData = $('#info #chunks-val');

  downloadUrlForm = $('#download #url');

  window.P2P = new Host();

  P2P.on('storageReady', function() {
    return fileForm.attr('disabled', false);
  });

  fileForm.on('change', function(event) {
    var file;
    file = P2P.host(event.target.files[0]);
    fileForm.attr('disabled', true);
    fileNameData.html(file.name);
    fileTypeData.html(file.type);
    fileSizeData.html("" + file.size + " bytes");
    fileChunksData.html(file.chunks);
    fileInfoSection.show();
    P2P.on('readProgress', function(r, c) {
      return fileProgressSection.html("" + r + " / " + c);
    });
    return P2P.on('fileEnd', function(f, t) {
      return downloadUrlForm.val("" + window.location.protocol + "//" + window.location.host + "/download.html?file=" + t);
    });
  });

}).call(this);
