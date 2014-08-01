/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var crypto = require('crypto');

module.exports = {

  new: function(req, res) {
    var party = {
      name: req.param('game_name'),
      tracks: req.param('game_tracks'),
      key: ''
    };

    var date = new Date().getTime();
    var code = crypto.createHash('md5').update(date + party.name).digest("hex");
    party.key = code.slice(0,6);

    req.session.settings = party;

    res.redirect('/game/player');
  },

  join: function(req, res) {
    var gamer = {
      username: req.param('game_username'),
      key: req.param('game_key')
    };

    var date = new Date().getTime();
    var code = crypto.createHash('md5').update(date + gamer.username).digest("hex");
    gamer.id = code.slice(0,6);

    req.session.settings = gamer;

    sails.sockets.blast('newPlayer', gamer, req.socket);

    res.redirect('/game/buzzer');
  },

  playDesktop: function(req, res) {
    res.view('game-desktop');
  },

  playMobile: function(req, res) {
    res.view('game-mobile');
  },

  gameSettings: function(req, res) {
    res.json(req.session.settings);
  },

  haveBuzz: function(req, res) {
    sails.sockets.blast('haveBuzz', req.params.all(), req.socket);
  },

  failBuzz: function(req, res) {
    sails.sockets.blast('failBuzz', req.params.all(), req.socket);
  },

  winBuzz: function(req, res) {
    sails.sockets.blast('winBuzz', req.params.all(), req.socket);
  },

  verifyAnswer: function(req, res) {
    sails.sockets.blast('verifyAnswer', req.params.all(), req.socket);
  },

  goodAnswer: function(req, res) {
    sails.sockets.blast('goodAnswer', req.params.all(), req.socket);
  },

  badAnswer: function(req, res) {
    sails.sockets.blast('badAnswer', req.params.all(), req.socket);
  }


};

