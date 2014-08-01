var buzzer = {

  $buzzer: $('#buzzer'),
  $modal: $('#modal-buzz'),
  $modal_form: $('.modal-form'),

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
      if (gamer.id == game.settings.id) _this.initBuzzer();
    });
    socket.on('winBuzz', function (gamer) {
      if (gamer.id == game.settings.id) _this.displayModal();
    });
    socket.on('goodAnswer', function (req) {
      if (req.gamer.id == game.settings.id) _this.initBuzzer();
    });
  },

  displayModal: function() {
    var _this = this;
    this.$modal.modal('show');
    this.$modal_form.one('submit', function (e) {
      e.preventDefault();
      _this.$modal.modal('hide');
      response = {
        answer: this.artiste_name.value,
        gamer: game.settings
      }
      this.artiste_name.value = "";
      socket.post('/game/verifyAnswer', response, function (){});
    });
  },

  initBuzzer: function() {
    this.buzz = false;
  }

};
