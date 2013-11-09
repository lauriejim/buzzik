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
    roomListed : function () {}
  },

  init : function (options) {
    this.params = $.extend(this.defaults, options);
  },

  listeRoom : function (rooms) {
    this.rooms = rooms;
    this.params.roomListed(this);
  },

  rejoindreRoom : function (room){
    socket.emit('rejoindreRoom', room, prompt('Mot de passe'), prompt('nom'));
  },

  roomAjoute : function () {
    this.params.roomAdded(this);
  },

  roomRejoint : function () {
    this.params.roomJoined(this);
  },

  emitBuzz : function () {
    socket.emit('buzz');
    this.params.emitBuzzed.call(this);
  },

  onBuzz : function () {
    this.params.onBuzzed(this);
  },

  envoiReponse : function (titre) {
     if(titre == ''){
        this.params.emptyAnswer(this);
      }else{
        this.params.issetAnswer(this);
      }
  },

  afficherBuzzer : function () {
    var element = document.getElementById(room.params.player);
    if (typeof element == 'undefined' || element == null) {
      this.params.appendBuzzer(this);
    }else{
      this.params.played(this);
    }
  },

  prochaineMusique : function (numTrack, etat) {
    this.etat = etat;
    this.numTrack = numTrack;
    var element = document.getElementById(this.params.player);
    if (typeof element != 'undefined' && element != null) {
      this.params.musiqueLoaded(this);
    }else{
     this.params.appendBuzzer(this);
    }
  },



  /* Formulaire */
  /***************************************/

  afficherFomulaire : function () {

    $("#reglages").append("<h2>Réglages de la partie</h2>");
    $("#reglages").append("<input type='text' placeholder='Nom de la partie' name='nomPartie' required /><br><br>");
    $("#reglages").append("<input type='text' placeholder='Mot de passe' name='passPartie' required /><br><br>");
    $("#reglages").append("<b>Nombre de chansons ?</b><br><input type='text' id='amount' style='border: 0;  font-weight: bold;' /><br><div id='nbrChanson'></div>");
    $("#reglages").append("<br><br><b>Nombre de joueur ?</b><br><div id='choisirNbrJoueur'></div><br>");
    $( "#nbrChanson" ).slider({
      range: "min",
      value: 5,
      min: 2,
      max: 10,
      slide: function (event, ui) {
        $("#amount").val(ui.value);
      }
    });
    $("#amount").val($( "#nbrChanson" ).slider( "value" ) + " chansons");
    $("#choisirNbrJoueur").load("template/choisirNbrJoueur.html", function(){
      room.choisirNbrJoueur();
    });

  },


  choisirNbrJoueur : function () {

    $("#choisirNbrJoueur img").hover(function(){
      var obj = $(this);
      var alt = obj.attr('alt');
      var src = obj.attr('src');

      var tab = src.split("/"),
        url = "";

      for(var i=0; i<tab.length-1; i++){
        url += tab[i]+"/";
      }

      src = tab[tab.length-1];

      var theImg = $("#choisirNbrJoueur img");
      for(var i=0; i<=alt; i++){
        theImg[i].src = url+"playerYes.png";
      }

      for(var w=i; w<theImg.length; w++){
        theImg[w].src = url+"playerNo.png";
      }

    });

    $('#choisirNbrJoueur').mouseleave(function () {
      var obj = $(this);
      var src = obj.find("img").attr('src');

      var tab = src.split("/"),
        url = "";

      for(var i=0; i<tab.length-1; i++){
        url += tab[i]+"/";
      }

      var theImg = $("#choisirNbrJoueur img");
      for(var i=0; i<theImg.length; i++){
        theImg[i].src = url+"playerNo.png";
      } 
    });

    $("#choisirNbrJoueur img").click(function () {
      var obj = $(this);
      var alt = parseInt(obj.attr('alt'))+1;

      $("#choisirNbrJoueur img").unbind('mouseenter').unbind('mouseleave');
      $("#choisirNbrJoueur").unbind("mouseleave");
      $("#choisirNbrJoueur img").unbind("click");

      room.params.nomPartie = $("input[name=nomPartie]").val();
      room.params.passPartie = $("input[name=passPartie]").val();
      room.params.nbrChanson = parseInt($("#amount").val());

      $("body").append("<div id='saisirEmailJoueur'></div>");
      room.creerRoom();
    });

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