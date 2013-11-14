var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


server.listen(1337);	

// liste des utilisateur
var usernames = new Array();

// liste des rooms disponible
var rooms = new Array();

// info musique
var numTrack;
var listMusiqueUrl = "";
var listMusiqueTitle = "";

io.sockets.on('connection', function (socket) {
	socket.join('accueil');
	socket.emit('afficherLesRoomsExistante', rooms)

	socket.on('ajouterRoom', function (nomPartie, passPartie, nbrJoueur, nbrChanson){
		var newRoom = {id: rooms.length, nom: nomPartie, motDePasse: passPartie, nbrJoueur: nbrJoueur, nbrChanson: nbrChanson, buzz: false};
		socket.room = rooms.length;
		rooms.push(newRoom);
		socket.join(socket.room);
		socket.emit('roomAjoute');
		socket.broadcast.to('accueil').emit('afficherLesRoomsExistante', rooms)
	});

	socket.on('rejoindreRoom', function(room, motDePasse, nom){
		if (rooms[room].motDePasse == motDePasse) {
			socket.join(room);
			socket.room = room;
			socket.name = nom;
			usernames.push({
				user : nom,
				point : 0,
				room : rooms[room].id
			})
			console.log(usernames);
			socket.emit('roomRejoin');
			socket.broadcast.to(socket.room).emit('roomRejoin');
		}else{
			socket.emit('message', 'Mauvais mot de passe');
		}
	});

	socket.on('playerPret', function(infoTrack){
		listMusiqueUrl = infoTrack.url;
		listMusiqueTitle = infoTrack.title;
		console.log(infoTrack.title);
		numTrack = Math.floor((Math.random()*(listMusiqueTitle.length-1))+1); 
		console.log(listMusiqueTitle[numTrack]);
		socket.emit('prochaineMusique', listMusiqueUrl[numTrack], 'pause');
	});

	socket.on('musiqueFini', function(){
		numTrack = Math.floor((Math.random()*(listMusiqueUrl.length-1))+1);
		console.log(listMusiqueTitle[numTrack])
		socket.emit('prochaineMusique', listMusiqueUrl[numTrack], 'play');
	});

	socket.on('buzz', function() {
		if (!rooms[socket.room].buzz) {
			rooms[socket.room].buzz = true;
			console.log(rooms[socket.room].buzz);
			socket.broadcast.to(socket.room).emit('buzz');
		}
		
	});

	socket.on('reponse', function(reponse){
		rooms[socket.room].buzz = false;
		console.log(rooms[socket.room].buzz);
		if(reponse.toLowerCase()  == listMusiqueTitle[numTrack].toLowerCase() ){
			numTrack = Math.floor((Math.random()*(listMusiqueUrl.length-1))+1);
			console.log(listMusiqueTitle[numTrack])
			io.sockets.to(socket.room).emit('prochaineMusique', listMusiqueUrl[numTrack], 'play');
		}else{
			io.sockets.to(socket.room).emit('afficheBuzzer');
		}
	});


});