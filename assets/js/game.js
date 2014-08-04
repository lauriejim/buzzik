var game = {

  $play_button: $('#start'),
  $pause_button: $('#pause'),
  $leave_button: $('#leave'),
  $gamer_list: $('#gamer-list'),
  $track_container: $('.track-container'),
  $modal_join: $('.join-game'),
  party_playlist: new Array(),
  haveBuzz: false,

  init: function() {
    if (document.getElementById('player')) {
      this.platform = 'player';
      this.playerInit();
    }

    if (document.getElementById('buzzer')) {
      this.platform = 'buzzer';
      this.buzzerInit();
    }

    if (this.$modal_join.attr('show')) this.$modal_join.modal('show');
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

    this.getSettings()
    .then(function (settings) {
      _this.settings = settings;
      var playlist = (_this.settings.playlist) ? _this.settings.playlist : '589406715';
      deezer.playlist(playlist)
      .then(function (playlist) {
        if (playlist.error) window.location = "/";
        _this.playlist = playlist;
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
        var track_index = Math.floor((Math.random() * _this.playlist.length-1) + 1);
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
    $('.track-count').html(this.currentTrack + 1 + ' / ' + this.party_playlist.length);
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
    if (this.currentTrack == this.party_playlist.length) return this.endGame();
    $('.gamer-status').removeClass('btn-primary btn-warning btn-success btn-danger').addClass('btn-primary');
    $('.timer-progress').css('left', '0px');
    $('.track-count').html(this.currentTrack + 1 + ' / ' + this.party_playlist.length);
    player.loadTrack(this.party_playlist[this.currentTrack].preview)
    .then(function() {
      player.playTrack();
    });
  },

  endGame: function() {
    var points = 0;
    var winner;
    this.$leave_button.removeClass('hidden');
    this.$play_button.addClass('hidden');
    $('.gamer-status').removeClass('btn-primary btn-warning btn-success btn-danger').addClass('btn-danger');
    $('.gamer-status span').each(function () {
      var gamer_points = $(this).html();
      if (gamer_points >= points) {
        points = gamer_points;
        winner = $(this).parent().attr('id').split('-')[1];
      }
    });
    socket.post('/game/endGame', {id: winner}, function(){});
    setTimeout(function () {
      $('#gamer-' + winner).removeClass('btn-danger').addClass('btn-success');
    }, 1500);
  },

  setSocketListener: function() {
    var _this = this;
    socket.on('newPlayer', function (gamer) {
      _this.displayGamer(gamer);
    });
    socket.on('haveBuzz', function (gamer) {
      _this.handleBuzz(gamer);
    });
    socket.on('haveLeave', function (gamer) {
      _this.haveLeave(gamer);
    });
    socket.on('verifyAnswer', function (response) {
      _this.verifyAnswer(response);
      _this.haveBuzz = false;
    });
  },

  displayGamer: function(gamer) {
    var template =
      '<div class="col-xs-4 col-sm-3 col-md-3">' +
        '<button class="btn bn-lg btn-primary btn-block gamer-status" id="gamer-' + gamer.id + '">' +
          gamer.username + '<span class="label-point label">0</span>' +
        '</button>' +
        '<div class="timer-progress-wrap timer-progress">' +
          '<div class="timer-progress-bar timer-progress" id="timer-' + gamer.id + '"></div>' +
        '</div>' +
      '</div>';
    this.$gamer_list.append(template);
  },

  displayTrack: function (status) {
    var track = this.party_playlist[this.currentTrack];
    var template =
      '<div class="col-md-12 bs-callout bs-callout-' + status + ' track-card">' +
        '<a class="pull-left" target="_blank" href="' + track.link + '">' +
          '<img class="card-object" src="' + track.album.cover + '" alt="track-cover">' +
        '</a>' +
        '<div class="card-body">' +
          '<h4 class="card-heading">' + track.artist.name + '</h4>' +
          '<p>' + track.title + '</p>' +
        '</div>' +
      '</div>';
    this.$track_container.prepend(template);
  },

  handleBuzz: function(gamer) {
    if (player.play) {
      player.pauseTrack();
      this.haveBuzz = true;
      $('#gamer-' + gamer.id).removeClass('btn-primary').addClass('btn-warning');
      this.timerCountdown(gamer, 0);
      socket.post('/game/winBuzz', gamer, function(){});
    }
    else {
      socket.post('/game/failBuzz', gamer, function(){});
    }
  },

  timerCountdown: function(gamer, s) {
    if(!this.haveBuzz) {
      return;
    }
    var _this = this;
    var duration = 15;
    var progress_bar = $('#timer-' + gamer.id);
    var progress_bar_width = progress_bar.width();
    var distance = progress_bar_width / duration;
    progress_bar.css('left', distance * s + 'px');
    s++
    if (s > duration) {
      this.haveBuzz = false;
      socket.post('/game/timeEnd', gamer, function(){});
      _this.badAnswer(gamer);
      return;
    }
    setTimeout(function () {
      _this.timerCountdown(gamer, s);
    }, 1000);
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
    $('#gamer-' + gamer.id).removeClass('btn-warning').addClass('btn-success');
    this.displayTrack('success');
    this.countPoints(gamer);
    socket.post('/game/goodAnswer', gamer, function(){});
    setTimeout(function() {
      _this.nextTrack();
    }, 1500);
  },

  badAnswer: function(gamer) {
    $('#gamer-' + gamer.id).removeClass('btn-warning').addClass('btn-danger');
    player.playTrack();
  },

  endTrack: function() {
    var _this = this;
    socket.post('/game/goodAnswer', {}, function(){});
    this.displayTrack('danger');
    $('.timer-progress').css('left', '0px');
    setTimeout(function() {
      _this.nextTrack();
    }, 1500);
  },

  haveLeave: function(gamer) {
    if (this.platform === 'player') {
      $('#gamer-' + gamer.id).parent().remove();
    }
    if (gamer.platform === 'player') {
      window.location = "/";
    }
  },

  countPoints: function(gamer) {
    var $span = $('#gamer-' + gamer.id + ' span');

    var max_points = 100;
    var min_points = 60;
    var dif_points = max_points - min_points;

    var win_points = max_points + Math.ceil( (player.current_time / 30 * - dif_points));

    player.$timer.text("+ " + win_points);
    $span.html(parseInt($span.html()) + win_points);
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
