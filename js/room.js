var room = {

  defaults : {
    player : '',
    buzzer : '',
    affichage : '',
    form : '',
    titre : '',
    listMusiqueUrl: '',
    listMusiqueTitle : '',

    emitBuzzed : function () {},
    onBuzzed : function () {},
    issetAnswer : function () {},
    emptyAnswer : function () {},
    appendBuzzer : function () {},
    played : function () {},
    roomAdded : function () {},
    roomJoined : function () {},
    musiqueLoaded : function () {},
    roomListed : function () {},
    playerListed : function () {}
  },

  init : function (options) {
    this.params = $.extend(this.defaults, options);
  },

  listeRoom : function (rooms) {
    this.rooms = rooms;
    this.params.roomListed.call(this);
  },

  rejoindreRoom : function (room){
    socket.emit('rejoindreRoom', room, prompt('Mot de passe'), prompt('nom'));
  },

  roomAjoute : function () {
    this.params.roomAdded.call(this);
  },

  roomRejoint : function () {
    $('#'+room.params.buzzer).remove();
    var element = document.getElementById(room.params.player);
    if (typeof element == 'undefined' || element == null) {
      this.params.roomJoined.call(this);
    }
    this.params.playerListed.call(this);
  },

  emitBuzz : function () {
    socket.emit('buzz');
  },

  validBuzz : function () {
    console.log('coucou');
    this.params.emitBuzzed.call(this);
  },

  onBuzz : function () {
    this.params.onBuzzed.call(this);
  },

  envoiReponse : function (titre) {
     if(titre == ''){
        this.params.emptyAnswer.call(this);
      }else{
        this.params.issetAnswer.call(this);
      }
  },

  afficherBuzzer : function () {
    var element = document.getElementById(room.params.player);
    if (typeof element == 'undefined' || element == null) {
      this.params.appendBuzzer.call(this);
      this.params.playerListed.call(this);
    }else{
      this.params.played(this);
    }
  },

  prochaineMusique : function (numTrack, etat) {
    this.etat = etat;
    this.numTrack = numTrack;
    var element = document.getElementById(this.params.player);
    if (typeof element != 'undefined' && element != null) {
      this.params.musiqueLoaded.call(this);
    }else{
     this.params.appendBuzzer.call(this);
    }
  },

  creerRoom : function () {
    $("#reglages").remove();

    alert("Créér une room de "+room.params.nbrJoueur+" joueur(s) au nom de "+room.params.nomPartie+" sur "+room.params.nbrChanson+" chansons !");

    /***************************************/

    socket.emit('ajouterRoom', room.params.nomPartie, room.params.passPartie, room.params.nbrJoueur, room.params.nbrChanson);

    /***************************************/

    function GetPlayList(a, b){
      var playListUrl = a.split(',');
      var playListTitle = b.split(',');
      $('body').load("template/player.html", function () {
        document.getElementById('player').volume = 0.1;
        $('#player').on('ended', function() {
          socket.emit('musiqueFini');
        });
        socket.emit('playerPret', {url: playListUrl, title: playListTitle});
      });
    }

    function GetUrlObjet(o) {
        for (i in o) {
            if (typeof(o[i])=="object") {
              console.log(o[i].preview);
              console.log(o[i].title);
              room.params.listMusiqueUrl = room.params.listMusiqueUrl + "," + o[i].preview;
              room.params.listMusiqueTitle = room.params.listMusiqueTitle + "," + o[i].title;
            }
        }
    }

    DZ.init({
      appId : '125515',
      channelUrl : 'http://web-infocom.fr/hetic/htmlcss',
      player : {
        onload : function(){}
      }
    });

    DZ.api('playlist/589406715', function(response){
      console.log(response.tracks.data);
      //Je récupére l'objet contenant la liste objet de chaque musique
      GetUrlObjet(response.tracks.data);
      //Je transforme mes bojets en deux tableau urlMP3 et Titre
      GetPlayList(room.params.listMusiqueUrl, room.params.listMusiqueTitle)
    });
  }

}