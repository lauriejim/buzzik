var player = {

  $timer: $('.track-progress-bar p'),
  $times_container: $('.track-progress-bar'),
  $play_button: $('#start'),
  $pause_button: $('#pause'),
  player: $('#audio-player')[0],
  border_progress: document.getElementById('inactive-progress'),
  progress_bar: document.getElementById('active-progress'),
  current_time: 0,
  play: false,

  init: function() {
    var _this = this;
    var progress_CTX = this.border_progress.getContext('2d');
    this.drawInactive(progress_CTX);
    this.$times_container.addClass('progress-bar-display');
    this.drawProgress();
    $(this.player).on('ended', function () {
      _this.$play_button.toggleClass('hidden');
      _this.$pause_button.toggleClass('hidden');
      game.endTrack();
    });
  },

  drawInactive: function(progress_CTX){
    progress_CTX.lineCap = 'square';

    progress_CTX.beginPath();
    progress_CTX.lineWidth = 15;
    progress_CTX.strokeStyle = '#e1e1e1';
    progress_CTX.arc(137.5,137.5,129,0,2*Math.PI);
    progress_CTX.stroke();

    progress_CTX.beginPath();
    progress_CTX.lineWidth = 0;
    progress_CTX.fillStyle = '#e6e6e6';
    progress_CTX.arc(137.5,137.5,121,0,2*Math.PI);
    progress_CTX.fill();

    progress_CTX.beginPath();
    progress_CTX.lineWidth = 0;
    progress_CTX.fillStyle = '#f7f7f7';
    progress_CTX.arc(137.5,137.5,100,0,2*Math.PI);
    progress_CTX.fill();
  },

  drawProgress: function(){
    var bar_CTX = this.progress_bar.getContext("2d");
    var quarter_turn = Math.PI / 2;
    var ending_angle = ((2*(this.current_time/30)) * Math.PI) - quarter_turn;
    var starting_angle = 0 - quarter_turn;

    this.progress_bar.width = this.progress_bar.width;
    bar_CTX.lineCap = 'square';

    bar_CTX.beginPath();
    bar_CTX.lineWidth = 20;
    bar_CTX.strokeStyle = '#76e1e5';
    bar_CTX.arc(137.5,137.5,111,starting_angle, ending_angle);
    bar_CTX.stroke();

    this.$timer.text( 30 - this.current_time + 's');
  },

  updateTimer: function(track) {
    this.current_time = Math.floor(track.currentTime);
    this.drawProgress();
  },

  loadTrack: function(track) {
    var deferred = $.Deferred();
    this.play = false;
    this.player.src = track;
    this.player.load();
    $(this.player).one('canplaythrough', function(){
      deferred.resolve();
    });
    return deferred.promise()
  },

  playTrack: function() {
    this.player.play();
    this.play = true;
    this.$play_button.toggleClass('hidden');
    this.$pause_button.toggleClass('hidden');
  },

  pauseTrack: function() {
    this.player.pause();
    this.play = false;
    this.$pause_button.toggleClass('hidden');
    this.$play_button.toggleClass('hidden');
  }

};
