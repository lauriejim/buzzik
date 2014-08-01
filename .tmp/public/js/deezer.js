var deezer = {

  init: function() {
    DZ.init({
      appId  : 'YOUR_APP_ID',
      channelUrl : 'http://YOUR_DOMAIN/channel.html'
    });
  },

  playlist: function(playlist_id) {
    var deferred = $.Deferred();
    DZ.api('playlist/' + playlist_id, function(playlist){
      deferred.resolve(playlist);
    });
    return deferred.promise()
  }

};
