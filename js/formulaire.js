var formulaire = {

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
      formulaire.choisirNbrJoueur();
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

}