/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var crypto = require('crypto');

module.exports = {

  home: function(req, res) {
    if (req.session) delete req.session;
    var key = req.param('join');
    res.view('homepage', {
      key: key
    });
  },

  new: function(req, res) {
    var party = {
      name: req.param('game_name'),
      tracks: req.param('game_tracks'),
      platform: 'player',
      playlist: req.param('game_playlist'),
      host: req.host,
      port: (sails.config.environment === "development") ? ':' + sails.config.port : "",
      key: ''
    };

    testKey();

    function testKey() {
      var rooms = sails.sockets.rooms();
      var room_exist = false;

      var date = new Date().getTime();
      var code = crypto.createHash('md5').update(date + party.name).digest("hex");
      party.key = code.slice(0,6);

      for (var i = 0, length = rooms.length; i < length; i++) {
        if (rooms[i] === party.key) room_exist = true;
      };

      if (room_exist) {
        testKey();
      } else {
        req.session.settings = party;
        res.redirect('/game/player');
      }
    }
  },

  join: function(req, res) {
    var gamer = {
      username: req.param('game_username'),
      key: req.param('game_key'),
      platform: 'gamer',
    };

    var date = new Date().getTime();
    var code = crypto.createHash('md5').update(date + gamer.username).digest("hex");
    gamer.id = code.slice(0,6);

    req.session.settings = gamer;

    var rooms = sails.sockets.rooms();
    var room_exist = false;

    for (var i = 0, length = rooms.length; i < length; i++) {
      if (rooms[i] === gamer.key) room_exist = true;
    };

    if (room_exist) {
      sails.sockets.broadcast(gamer.key, 'newPlayer', gamer, req.socket);
      res.redirect('/game/buzzer');
    } else {
      res.redirect('/');
    }
  },

  playDesktop: function(req, res) {
    res.view('game-desktop');
  },

  playMobile: function(req, res) {
    res.view('game-mobile');
  },

  gameSettings: function(req, res) {
    if (req.session.settings) {
      req.session.settings.connected = true;
      sails.sockets.join(req.socket, req.session.settings.key);
    }

    res.json(req.session.settings);
  },

  haveBuzz: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'haveBuzz', req.params.all(), req.socket);
  },

  failBuzz: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'failBuzz', req.params.all(), req.socket);
  },

  winBuzz: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'winBuzz', req.params.all(), req.socket);
  },

  verifyAnswer: function(req, res) {
    sails.sockets.broadcast(req.param('gamer').key, 'verifyAnswer', req.params.all(), req.socket);
  },

  goodAnswer: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'goodAnswer', req.params.all(), req.socket);
  },

  badAnswer: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'badAnswer', req.params.all(), req.socket);
  },

  timeEnd: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'timeEnd', req.params.all(), req.socket);
  },

  haveLeave: function(gamer) {
    sails.sockets.broadcast(gamer.key, 'haveLeave', gamer);
  },

  endGame: function(req, res) {
    sails.sockets.broadcast(req.param('key'), 'endGame', req.params.all(), req.socket);
  }

};

