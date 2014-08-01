var game = {

  $play_button: $('#start'),
  $pause_button: $('#pause'),
  $gamer_list: $('#gamer-list'),
  party_playlist: new Array(),

  init: function() {
    if (document.getElementById('player')) {
      this.platforme = 'player';
      this.playerInit();
    }

    if (document.getElementById('buzzer')) {
      this.platforme = 'buzzer';
      this.buzzerInit();
    }
  },

  buzzerInit: function() {
    var _this = this;
    buzzer.init();
    this.getSettings()
    .then(function (settings) {
      _this.settings = settings;
    });
  },

  playerInit: function() {
    var _this = this;
    this.setSocketListener();

    player.init();

    deezer.init();

    deezer.playlist('640657295')
    .then(function (playlist) {
      _this.playlist = playlist;
      _this.getSettings()
      .then(function (settings) {
        _this.settings = settings;
        _this.createPlaylist();
      });
    });
  },

  getSettings: function() {
    var deferred = $.Deferred();
    var _this = this;
    socket.post('/game/settings', function (settings) {
      deferred.resolve(settings);
    });
    return deferred.promise();
  },

  createPlaylist: function() {
    var _this = this;
    var playlist = new Array();
    var track_selected = new Array();

    for (var i = 0, length = this.playlist.tracks.data.length; i < length; i++) {
      var track = this.playlist.tracks.data[i];
      if (track.readable) playlist.push(track);
    }

    this.playlist = playlist;

    if (this.playlist.length < this.settings.tracks) this.settings.tracks = this.playlist.length;

    insertTrack();

    function insertTrack() {
      if (_this.party_playlist.length == _this.settings.tracks) {
        _this.startGame();
      } else {
        var track_index = Math.floor((Math.random() * _this.playlist.length) + 1);
        var track = _this.playlist[track_index];

        if (track_selected.indexOf(track_index) === -1) {
          _this.party_playlist.push(track);
          track_selected.push(track_index);
        }

        insertTrack();
      }
    }
  },

  startGame: function() {
    var _this = this;
    this.currentTrack = 0;
    player.loadTrack(this.party_playlist[this.currentTrack].preview)
    .then(function() {
      _this.$play_button.toggleClass('hidden');
      _this.$play_button.on('click', function () {
        player.playTrack();
      });
      _this.$pause_button.on('click', function () {
        player.pauseTrack();
      });
    });
  },

  setSocketListener: function() {
    var _this = this;
    socket.on('newPlayer', function (gamer) {
      var template =
      '<div class="col-sm-3 col-md-3">' +
        '<button class="btn bn-lg btn-primary btn-block" id="gamer-' + gamer.id + '">' + gamer.username + '</button>' +
      '</div>';
      _this.$gamer_list.append(template);
    });
    socket.on('haveBuzz', function (gamer) {
      if (player.play) {
        player.pauseTrack();
        $('#gamer-'+gamer.id).removeClass('btn-primary').addClass('btn-warning');
        socket.post('/game/winBuzz', gamer, function(){});
      }
      else {
        socket.post('/game/failBuzz', gamer, function(){});
      }
    });
    socket.on('verifyAnswer', function (req) {
      $('#gamer-'+req.gamer.id).removeClass('btn-warning').addClass('btn-success');
      socket.post('/game/goodAnswer', req, function(){});
    });
  },

  verifyAnswer: function() {

  }
};
