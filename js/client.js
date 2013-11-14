var socket = io.connect('http://localhost:1337');

socket.on('connect', function () {

  room.init({
    player : 'player',
    buzzer : 'buzzer',
    affichage : 'rooms',
    form : 'titleform',
    titre : 'title',
    listeJoueur: 'listeJoueur',

    roomListed : function () {
      $('#'+room.params.affichage).empty();
      for (i in room.rooms) {
        $('#'+room.params.affichage).append('<div><a href="#" onclick="room.rejoindreRoom(\''+room.rooms[i].id+'\')">' + room.rooms[i].nom + '</a></div>');
      }
    },

    playerListed : function () {
      console.log(room.usernames);
      $('#'+room.params.listeJoueur).empty();
      for (i in room.usernames) {
        $('#'+room.params.listeJoueur).append('Nom : '+room.usernames[i].user+' Point : '+room.usernames[i].point+'<br>');
      }
    },

    emitBuzzed : function () {
      $('body').load("template/formulaire.html", function () {
        $('#'+room.params.titre).focus();
        $('#'+room.params.form).submit(function (e) {
          e.preventDefault();
          room.envoiReponse($('#'+room.params.titre).val());
          return false;
        });
      });
    },

    onBuzzed : function () {
      //$('#'+room.params.buzzer).remove();
      var element = document.getElementById(room.params.player);
      if (typeof element != 'undefined' && element != null) {
        document.getElementById(room.params.player).pause();
      }
    },

    emptyAnswer : function () {
      alert('Vous devez entrer un titre !');
    },

    issetAnswer : function () {
      socket.emit('reponse', $('#'+room.params.titre).val());
    },

    appendBuzzer : function () {
      $('#'+room.params.buzzer).remove();
      $('body').load("template/buzzer.html");
    },

    played : function () {
      document.getElementById(room.params.player).play();
    },

    roomAdded : function () {
      $('#accueil').remove();
    },

    roomJoined : function () {
      $('body').load("template/buzzer.html");
    },

    musiqueLoaded : function () {
      document.getElementById(room.params.player).src = room.numTrack;
      if (room.etat == "play") {
        document.getElementById(room.params.player).play();
        document.getElementById(room.params.player).addEventListener('ended', function() {
          socket.emit('musiqueFini');
        });
      }
    }
  }); 

  formulaire.afficherFomulaire();


});




socket.on('message', function (message) {
  alert(message);
});

socket.on('afficherLesRoomsExistante', function (rooms) {
  room.listeRoom(rooms);
});

socket.on('roomAjoute', function () {
  room.roomAjoute();
});

socket.on('roomRejoin', function () {
  room.roomRejoint();
});

socket.on('afficherJoueur', function (usernames, rooms) {
  room.usernames = usernames;
  room.room = rooms;
  room.afficherJoueur();
})

socket.on('prochaineMusique', function(numTrack, etat){
  room.prochaineMusique(numTrack, etat)
});

socket.on('buzz', function () {
  console.log('buzz dans la room');
  room.onBuzz();
});

socket.on('valideBuzz', function (a) {
  console.log(a);
  room.valideBuzz();
});

socket.on('afficheBuzzer', function () {
  room.afficherBuzzer();
});