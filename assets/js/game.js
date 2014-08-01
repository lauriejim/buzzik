var game = {

  $play_button: $('#start'),
  $pause_button: $('#pause'),
  $gamer_list: $('#gamer-list'),
  party_playlist: new Array(),
  haveBuzz: false,

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
        if (!_this.haveBuzz) player.playTrack();
      });
      _this.$pause_button.on('click', function () {
        player.pauseTrack();
      });
    });
  },

  nextTrack: function() {
    this.currentTrack++;
    if (this.currentTrack == this.party_playlist.length) return;
    player.loadTrack(this.party_playlist[this.currentTrack].preview)
    .then(function() {
      player.playTrack();
    });
  },

  setSocketListener: function() {
    var _this = this;
    socket.on('newPlayer', function (gamer) {
      var template =
      '<div class="col-sm-3 col-md-3">' +
        '<button class="btn bn-lg btn-primary btn-block gamer-status" id="gamer-' + gamer.id + '">' + gamer.username + '</button>' +
      '</div>';
      _this.$gamer_list.append(template);
    });
    socket.on('haveBuzz', function (gamer) {
      if (player.play) {
        player.pauseTrack();
        game.haveBuzz = true;
        $('#gamer-'+gamer.id).removeClass('btn-primary').addClass('btn-warning');
        socket.post('/game/winBuzz', gamer, function(){});
      }
      else {
        socket.post('/game/failBuzz', gamer, function(){});
      }
    });
    socket.on('verifyAnswer', function (response) {
      _this.verifyAnswer(response);
      _this.haveBuzz = false;
    });
  },

  verifyAnswer: function(response) {
    var artist_name = this.party_playlist[this.currentTrack].artist.name.toLowerCase();
    var gamer_response = response.answer.toLowerCase();

    var result = this.levenshteinDistance(gamer_response, artist_name);

    if (gamer_response.length > artist_name.length) max_length = gamer_response.length;
    else max_length = artist_name.length;

    percentage = (max_length-result)*100/max_length;

    if (percentage >= 70) {
      this.goodAnswer(response.gamer);
    } else {
      this.badAnswer(response.gamer);
    }
  },

  goodAnswer: function(gamer) {
    var _this = this;
    $('#gamer-'+gamer.id).removeClass('btn-warning').addClass('btn-success');
    socket.post('/game/goodAnswer', gamer, function(){});
    setTimeout(function() {
      _this.nextTrack();
      $('.gamer-status').removeClass('btn-primary btn-warning btn-success btn-danger');
      $('.gamer-status').addClass('btn-primary');
    }, 1000);
  },

  badAnswer: function(gamer) {
    $('#gamer-'+gamer.id).removeClass('btn-warning').addClass('btn-danger');
    player.playTrack();
  },

  endTrack: function() {
    socket.post('/game/goodAnswer', {}, function(){});
    this.nextTrack();
    $('.gamer-status').removeClass('btn-primary btn-warning btn-success btn-danger');
    $('.gamer-status').addClass('btn-primary');
  },

  levenshteinDistance: function(a, b){
    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    var matrix = [];

    var i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    var j;
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i-1) == a.charAt(j-1)) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(matrix[i-1][j-1] + 1,
                         Math.min(matrix[i][j-1] + 1,
                                  matrix[i-1][j] + 1));
        }
      }
    }

    return matrix[b.length][a.length];
  }
};
