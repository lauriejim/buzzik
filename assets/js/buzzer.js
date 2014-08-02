var buzzer = {

  $buzzer: $('#buzzer'),
  $modal: $('#modal-buzz'),
  $modal_form: $('.modal-form'),
  $modal_input: $('input[name="artist_name"]'),
  $modal_close: $('.close'),

  init: function() {
    var height = $(window).height();
    this.$buzzer.height(height);
    this.listenBuzz();
    this.setSocketListener();
  },

  listenBuzz: function() {
    var _this = this;
    this.$buzzer.on('click', function () {
      if (!_this.buzz) {
        socket.post('/game/haveBuzz', game.settings, function (){});
        _this.buzz = true;
      }
    });
  },

  setSocketListener: function() {
    var _this = this;
    socket.on('failBuzz', function (gamer) {
      if (gamer.id === game.settings.id) _this.initBuzzer();
    });
    socket.on('winBuzz', function (gamer) {
      if (gamer.id === game.settings.id) _this.displayModal();
    });
    socket.on('timeEnd', function (gamer) {
      if (gamer.id === game.settings.id) _this.hideModal();
    });
    socket.on('goodAnswer', function (req) {
      _this.initBuzzer();
    });
  },

  displayModal: function() {
    var _this = this;
    this.$modal.modal('show');
    this.$modal_close.one('click', function (e){
      e.preventDefault();
      _this.$modal.modal('hide');
      response = {
        answer: "",
        gamer: game.settings
      }
      _this.$modal_input.val("");
      socket.post('/game/verifyAnswer', response, function (){});
    });
    this.$modal_form.one('submit', function (e) {
      e.preventDefault();
      _this.$modal.modal('hide');
      response = {
        answer: _this.$modal_input.val(),
        gamer: game.settings
      }
      _this.$modal_input.val("");
      socket.post('/game/verifyAnswer', response, function (){});
    });
  },

  hideModal: function() {
    this.$modal_input.val("");
    this.$modal.modal('hide');
  },

  initBuzzer: function() {
    this.buzz = false;
  }

};
