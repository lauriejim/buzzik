var socket = io.connect('http://localhost:1337');

socket.on('connect', function () {

  room.init({

  });

  room.afficherFomulaire();


});




socket.on('message', function (message) {
  alert(message);
});

socket.on('afficherLesRoomsExistante', function (rooms) {
  $('#rooms').empty();
  for (i in rooms) {
    $('#rooms').append('<div><a href="#" onclick="rejoindreRoom(\''+rooms[i].id+'\')">' + rooms[i].nom + '</a></div>');
  }
});

socket.on('roomAjoute', function () {
  $('#accueil').remove();
});

socket.on('roomRejoin', function () {
  $('#accueil').remove();
  $('body').load("template/buzzer.html");
});

socket.on('prochaineMusique', function(numTrack, etat){
  var element = document.getElementById('player');
  if (typeof element != 'undefined' && element != null) {
    document.getElementById('player').src = numTrack;
    if (etat == "play") {
      document.getElementById('player').play();
      document.getElementById('player').addEventListener('ended', function() {
        socket.emit('musiqueFini');
      });
    }
  }else{
    $('#buzzer').remove();
    $('body').load("template/buzzer.html");
  }
});

socket.on('buzz', function () {
  $('#buzzer').remove();
  var element = document.getElementById('player');
  if (typeof element != 'undefined' && element != null) {
    document.getElementById('player').pause();
  }
});

socket.on('afficheBuzzer', function () {
  var element = document.getElementById('player');
  if (typeof element == 'undefined' || element == null) {
    $('#buzzer').remove();
    $('body').load("template/buzzer.html");
  }else{
    document.getElementById('player').play();
  }
});


function rejoindreRoom(room){
  socket.emit('rejoindreRoom', room, prompt('Mot de passe'), prompt('nom'));
}