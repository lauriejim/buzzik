var room = {

  // Définition des variables et callback de l'obj room
  defaults : {
    player : '',
    buzzer : '',
    affichage : '',
    form : '',
    titre : '',
    listMusiqueUrl: '',
    listMusiqueTitle : '',
    listeMusique : '',
    idplaylist : '8512362',

    emitBuzzed : function () {},
    onBuzzed : function () {},
    issetAnswer : function () {},
    emptyAnswer : function () {},
    appendBuzzer : function () {},
    played : function () {},
    roomAdded : function () {},
    musiqueLoaded : function () {},
    roomListed : function () {},
    playerListed : function () {},
    musiqueListed: function () {}
  },

  // Merge des infos rempli côté utilisateur et obj
  init : function (options) {
    this.params = $.extend(this.defaults, options);
  },

  // Liste des rooms (ARRAY)
  // mise en mémoire des rooms
  // active le callback pour lister les rooms
  listeRoom : function (rooms) {
    this.rooms = rooms;
    this.params.roomListed.call(this);
  },

  // Connection à une room (INT)
  // appelle la fonction pour se connecter à la room
  rejoindreRoom : function (room){
    connect(room);
  },

  // L'utilisateur à bien rejoin une room
  // active le callback pour kill l'accueil
  roomAjoute : function (data) {
    this.params.roomAdded.call(this);
    // Envoi le mail
    var idRoom = data.idRoom;
    var strWindowFeatures = "toolbar=no,resize=no,titlebar=no,";
    strWindowFeatures = strWindowFeatures + "menubar=no,width=200,height=200,maximize=null";
    window.open('http://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=http://buzzik.local:1337/join?room='+idRoom, '', strWindowFeatures); 
  },

  // L'utilisateur à rejoin une room 
  // test si l'élément player existe
  // si 'non'
    // active le callback d'affichage du buzzer
  roomRejoint : function () {
    var element = document.querySelector(room.params.player);
    if (typeof element == 'undefined' || element == null) {
      this.params.appendBuzzer.call(this);
    }
  },

  // Affichage des joueurs
  // active le callback d'affichage des joueurs
  afficherJoueur : function () {
    this.params.playerListed.call(this);
  },

  // Affichage des musiques jouées
  // active le callback d'affichage des musiques jouées
  afficherMusique : function () {
    this.params.musiqueListed.call(this);
  },

  // Envoie du buzz
  // envoie au server le fait que l'utilisateur à buzzé
  emitBuzz : function () {
    socket.emit('buzz');
  },

  // Le buzz à été validé côté server
  // active le callback qui affiche le formulaire de réponse
  valideBuzz : function () {
    this.params.emitBuzzed.call(this);
  },

  // Un utilisateur à buzzé dans la room
  // active le callback mettant en pse le player
  onBuzz : function (data) {
    this.params.onBuzzed.call(this, data);
  },

  // Reception de la réponse
  // test si elle est vide
  // si 'oui'
    // active le callback pour annoncer que la réponse est vide
  // si 'non'
    // active le callback pour afficher le buzzer
  envoiReponse : function (titre) {
     if(titre == ''){
        this.params.emptyAnswer.call(this);
      }else{
        this.params.issetAnswer.call(this);
      }
  },

  // Affiche le buzer
  // test si l'élément player existe
  // si 'non'
    // active le callback d'affichage du buzer
    // active le callback l'affichage des joueurs et scores
  // si 'non'
    // active le callback pour mettre play la musiqe
    // active le callback pour afficher les joueurs et scores
  afficherBuzzer : function () {
    var element = document.querySelector(room.params.player);
    if (typeof element == 'undefined' || element == null) {
      this.params.appendBuzzer.call(this);
      this.params.playerListed.call(this);
    }else{
      this.params.played(this);
      this.params.playerListed.call(this);
    }
  },

  // Mettre en place la prochaine musique (INT, STRING)
  // mise en memoir des infos
  // test si m'élément player existe
  // si 'oui'
    // active le callback pour changer la musique
  // si 'non'
    // active le callback pour afficher le buzzer
  prochaineMusique : function (numTrack, etat) {
    this.etat = etat;
    this.numTrack = numTrack;
    var element = document.querySelector(this.params.player);
    if (typeof element != 'undefined' && element != null) {
      this.params.musiqueLoaded.call(this);
    }else{
     this.params.appendBuzzer.call(this);
    }
  },

  // Création d'une room
  creerRoom : function () {
    $("#all").fadeOut().hide();

    /***************************************/

    // Envoie au server des info de la partie pour qu'il crée la room
    socket.emit('ajouterRoom', room.params.nomPartie, room.params.nbrJoueur, room.params.nbrChanson);

    /***************************************/

    // Création de la playlist et envoie au server des infos
    function GetPlayList(a, b, c, d){
      $('#all').load("template/jeu.html", function(){
        
        setTimeout(function(){

          $.event.trigger({
            type: "chargementJeu",
            message: "",
            time: new Date()
          });

          $("#all").fadeIn().show();
          $('link[rel=stylesheet]:last-of-type').attr("href", "css/jeu.css");
          socket.emit('playerPret', {url: a, title: b, artist: c, cover: d});

        }, 500)        
      });
    }

    // Récupération des infos utile de chaque musique de la playlist deezer
    function GetUrlObjet(o) {

      room.params.listMusiqueUrl = new Array();
      room.params.listMusiqueTitle = new Array();
      room.params.listMusiqueArtist = new Array();
      room.params.listMusiqueCover = new Array();

        for (var i=0; i<o.length; i++) {
            
              room.params.listMusiqueUrl.push(o[i].preview);
              room.params.listMusiqueTitle.push(o[i].title);
              room.params.listMusiqueArtist.push(o[i].artist.name);
              room.params.listMusiqueCover.push(o[i].album.cover);
            
        }
    }

    DZ.init({
      appId : '125515',
      channelUrl : '',
      player : {
        onload : function(){}
      }
    });

    DZ.api('playlist/'+room.params.idplaylist, function(response){

      //Je récupére l'objet contenant la liste objet de chaque musique
      GetUrlObjet(response.tracks.data);
      //Je transforme mes bojets en deux tableau urlMP3 et Titre
      GetPlayList(room.params.listMusiqueUrl, room.params.listMusiqueTitle, room.params.listMusiqueArtist, room.params.listMusiqueCover)
    });
  }

}
  
// Connection à une room via avec FBconnect
function connect(room){

      socket.emit('rejoindreRoom', room, prompt('Entrer votre pseudo'));
      return false;
}  