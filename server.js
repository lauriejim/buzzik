var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// include des fichiers
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/img", express.static(__dirname + '/img'));
app.use("/images", express.static(__dirname + '/images'));
app.use("/font", express.static(__dirname + '/font'));
app.use("/template", express.static(__dirname + '/template'));
app.use("/video", express.static(__dirname + '/video'));

// gestion des routes
app.get('/', function(req, res) {
  res.render('index.ejs');
});

app.get('/join', function(req, res) {
  res.render('player.ejs');
});

server.listen(1337);

// fonction timer
var timerSong;

// liste des utilisateur et rooms
var usernames = new Array();
var rooms = new Array();

// info musique
var numTrack;
var listMusiqueUrl = "";
var listMusiqueTitle = "";
var listMusiqueArtist = "";
var listMusiqueCover = "";

// compteur
var numRoom = 1;
var numUser = 1;

// Action à effectuer lors de la connection
io.sockets.on('connection', function (socket) {
	
    // Ajout à la room 'accueil' et affichage des rooms existante
	socket.join('accueil');
	socket.emit('afficherLesRoomsExistante', rooms)

    // Création de la room (STRING, INT, INT)
	socket.on('ajouterRoom', function (nomPartie, nbrJoueur, nbrChanson){
        console.log('/////////////////////////////////');
        console.log('///// Une partie à été crée /////');
        console.log('/////////////////////////////////');
		var newRoom = {id: numRoom, nom: nomPartie, nbrJoueur: nbrJoueur, nbrChanson: nbrChanson, listeMusique: [], play: false, buzz: true};
        socket.room = numRoom;
        socket.numRoom = numRoom;
        rooms[socket.numRoom] = newRoom;
        socket.join(socket.room);

        /* Envoi des emails aux personnes */
        socket.emit('roomAjoute', { idRoom : socket.numRoom});
        socket.broadcast.to('accueil').emit('afficherLesRoomsExistante', rooms);
        numRoom++;
	});

    // Rejoindre une room (INT, STRING)
	socket.on('rejoindreRoom', function(room, nom){
		if (rooms[room] != null) {
            var nbrPlayerPartie = 0;
            for (k in usernames) {
                    if (usernames[k].room == rooms[room].id) {
                            nbrPlayerPartie++;
                    }
            }
            if (nbrPlayerPartie < rooms[room].nbrJoueur) {
                socket.join(room);
                socket.room = room;
                socket.numUser = numUser;
                usernames[socket.numUser] = {
                    id : numUser,
                    user : nom,
                    point : 0,
                    room : rooms[room].id
                };
                socket.emit('roomRejoin');
                socket.broadcast.to(socket.room).emit('refreshScrore');
                numUser++;
            }else{
                    socket.emit('message', 'La partie est pleine');
                    socket.emit('accueilLocation');
            }
	    }else{
	            socket.emit('message', 'cette room n\'existe pas');
                socket.emit('accueilLocation');
	    }
	});

    // Player est prêt à être lancé (ARRAY)
	socket.on('playerPret', function(infoTrack){
        listMusiqueUrl = infoTrack.url;
        listMusiqueTitle = infoTrack.title;
        listMusiqueArtist = infoTrack.artist;
        listMusiqueCover = infoTrack.cover;
        numTrack = Math.floor((Math.random()*(listMusiqueTitle.length-1))+1);
        rooms[socket.room].listeMusique.push(numTrack);
        rooms[socket.room].musiqueCourante = listMusiqueTitle[numTrack];
        socket.emit('prochaineMusique', listMusiqueUrl[numTrack], 'pause');
        rooms[socket.room].timer = 0;
    });

    // Début de partie
    // active le fait de pouvoir buzzer
    socket.on('debutPartie', function (){
        rooms[socket.room].play = true;
        rooms[socket.room].buzz = false;
        timerSong =  setInterval(function(){
            if (rooms[socket.room] != undefined) {
              rooms[socket.room].timer += 0.1;  
            }
        }, 100);
    });

    // Met en pause la partie
    // désactive le fait de pouvoir buzzer
    socket.on('pausePartie', function (){
        rooms[socket.room].play = false;
        rooms[socket.room].buzz = true;
        clearInterval(timerSong);
    });

    // Fin automatique de la musique si elle n'a pas été trouvé
    socket.on('musiqueFini', function(){
        if (rooms[socket.room].listeMusique.length != rooms[socket.room].nbrChanson) {
            var listesInfos = new Array();
            for (l = 0 ; l < rooms[socket.room].listeMusique.length ; l++) {
                listesInfos[l] = {
                    cover: listMusiqueCover[rooms[socket.room].listeMusique[l]],
                    artist: listMusiqueArtist[rooms[socket.room].listeMusique[l]],
                    title: listMusiqueTitle[rooms[socket.room].listeMusique[l]]
                };
            }

            io.sockets.to(socket.room).emit('refreshListesInfos', listesInfos);
            do {
                numTrack = Math.floor((Math.random()*(listMusiqueUrl.length-1))+1);
                verif = Verif(numTrack, rooms[socket.room].listeMusique);
            }while(verif);
            rooms[socket.room].listeMusique.push(numTrack);
            rooms[socket.room].musiqueCourante = listMusiqueTitle[numTrack];
            io.sockets.to(socket.room).emit('prochaineMusique', listMusiqueUrl[numTrack], 'play');
            rooms[socket.room].timer = 0;
        }else{
                io.sockets.to(socket.room).emit('accueilLocation');

        }
    });

    // Reception d'un buzz
    socket.on('buzz', function() {
        if (!rooms[socket.room].buzz && rooms[socket.room].play) {
            rooms[socket.room].buzz = true;
            rooms[socket.room].play = false;
            socket.broadcast.to(socket.room).emit('buzz', socket.numUser);
            socket.emit('valideBuzz');
        }
    });

    // Reception d'une réponse
    socket.on('reponse', function(reponse){
        rooms[socket.room].buzz = false;
        rooms[socket.room].play = true;

        var pourcentage = compareStr(reponse, rooms[socket.room].musiqueCourante); 
        if(pourcentage >= 70){ // Si la réponse est à 70% exacte
            if (rooms[socket.room].listeMusique.length != rooms[socket.room].nbrChanson) {
                
                var listesInfos = new Array();
                for (l = 0 ; l < rooms[socket.room].listeMusique.length ; l++) {
                    listesInfos[l] = {
                        cover: listMusiqueCover[rooms[socket.room].listeMusique[l]],
                        artist: listMusiqueArtist[rooms[socket.room].listeMusique[l]],
                        title: listMusiqueTitle[rooms[socket.room].listeMusique[l]]
                    };
                }

                io.sockets.to(socket.room).emit('refreshListesInfos', listesInfos);
                do {
                    numTrack = Math.floor((Math.random()*(listMusiqueUrl.length-1))+1);
                    verif = Verif(numTrack, rooms[socket.room].listeMusique);
                }while(verif);
                rooms[socket.room].listeMusique.push(numTrack);
                rooms[socket.room].musiqueCourante = listMusiqueTitle[numTrack];

                if(rooms[socket.room].timer > 29){
                    rooms[socket.room].timer = 29;
                }
                    

                usernames[socket.numUser].point += Math.ceil(100-(50/(30/rooms[socket.room].timer)));
                io.sockets.to(socket.room).emit('refreshScrore');
                io.sockets.to(socket.room).emit('prochaineMusique', listMusiqueUrl[numTrack], 'play');
                rooms[socket.room].timer = 0;
            }else{

                if(rooms[socket.room].timer > 29){
                    rooms[socket.room].timer = 29;
                }

                usernames[socket.numUser].point += Math.ceil(100-(50/(30/rooms[socket.room].timer)));
                io.sockets.to(socket.room).emit('message', 'Fin de la partie');
                io.sockets.to(socket.room).emit('accueilLocation');

            }
                
        }else{
                io.sockets.to(socket.room).emit('afficheBuzzer');
        }
    });

    // Envoie des infos de partie
    // envoie des infos de la partie à l'urilisateur
    socket.on('refreshScrore', function () {
            socket.emit('afficherJoueur', usernames, socket.room, socket.numUser);
    });

    // Deconnection
    socket.on('disconnect', function () {
            if (socket.numUser != undefined) {
                    socket.join("accueil");
                    delete usernames[socket.numUser];
                    socket.numUser = undefined;
                    socket.broadcast.to(socket.room).emit('refreshScrore');
            }
            if (socket.numRoom != undefined) {
                console.log('/////////////////////////////////////');
                console.log('///// Une partie à été terminée /////');
                console.log('/////////////////////////////////////');
                    clearInterval(timerSong);
                    socket.join("accueil");
                    delete rooms[socket.numRoom];
                    socket.numRoom = undefined;
                    socket.broadcast.to(socket.room).emit('accueilLocation');
                    io.sockets.to('accueil').emit('afficherLesRoomsExistante', rooms)
            }
    });

    // Fonction de vérification (INT, ARRAY)
    function Verif(a, liste)
    {
        var x = 0;
        while(x < liste.length){
            if(liste[x] == a){
                return true;
            }
            x++;
        }
    }

    function compareStr(reponseUser, laBonneReponse){
        var result = 0;
        var plusGrandChaine = 0;

        // Passage de la réponse en minuscule
        // De même pour la bonne réponse
        reponseUser = reponseUser.toLowerCase();
        laBonneReponse = laBonneReponse.toLowerCase();

        if(reponseUser.length > laBonneReponse.length)
            plusGrandChaine = reponseUser.length;
        else
            plusGrandChaine = laBonneReponse.length;

        // On récupère le nombre de caractère d'écart entre la réponse et la bonne réponse
        result = levenshteinDistance(reponseUser, laBonneReponse);

        // On mets ça sous forme de pourcentage pour avoir le degré de ressemblance
        var pourcentage = (plusGrandChaine-result)*100/plusGrandChaine;

        return pourcentage;
    }


    function levenshteinDistance(a, b){
      if(a.length == 0) return b.length; 
      if(b.length == 0) return a.length; 
     
      var matrix = [];
     
      // increment along the first column of each row
      var i;
      for(i = 0; i <= b.length; i++){
        matrix[i] = [i];
      }
     
      // increment each column in the first row
      var j;
      for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
      }
     
      // Fill in the rest of the matrix
      for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
          if(b.charAt(i-1) == a.charAt(j-1)){
            matrix[i][j] = matrix[i-1][j-1];
          } else {
            matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                    Math.min(matrix[i][j-1] + 1, // insertion
                                             matrix[i-1][j] + 1)); // deletion
          }
        }
      }
     
      return matrix[b.length][a.length];
    }

});