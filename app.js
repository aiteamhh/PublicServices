var restify = require('restify');
var builder = require('botbuilder');


// Setup Restify Server
var server = restify.createServer();

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.post('/api/messages', connector.listen()); // Listen for messages from users 

// =========== CONFIG END ================

var bot = new builder.UniversalBot(connector);


bot.dialog('/', [
	function (session, args){
		builder.Prompts.text(session, 'Hallo... Wie heißt du?');
	},
	function (session, results) {
		session.userData.name = results.response;	
		session.beginDialog('/maindialog');
	},
	function (session, results) {
		session.send("Auf Wiedersehen!");
		session.endConversation();
	}
]);

var dom = 'Info zum Hamburger Dom';
var pass = 'Reisepass beantragen';
var end = 'Danke, nichts mehr';
var Options = [dom, pass, end];
var listStyle = { listStyle: builder.ListStyle.button };

bot.dialog('/maindialog', [
    function (session, args, next) {   
		if (args && args.repromt) {
			builder.Prompts.choice(session, 'Kann ich noch etwas für dich tun, '+ session.userData.name + '?', Options, listStyle);
		}
		else {
			builder.Prompts.choice(session, 'Hallo '+ session.userData.name + ', wie kann ich dir helfen?', Options, listStyle);
		}
    },
    function (session, results, next) {
        session.userData.choice = results.response.entity;
		
		switch (session.userData.choice){
			case 'Info zum Hamburger Dom':
				var  domText = "Der Hamburger Dom ist ein regelmäßig auf dem Heiligengeistfeld in Hamburg stattfindendes Volksfest. Jährlich besuchen mehrere Millionen Menschen die Veranstaltung, die dreimal im Jahr stattfindet";
				session.send(domText);
				session.send("-> Winterdom (Dom-Markt, Anfang November bis Anfang Dezember)");
				session.send("-> Frühlingsdom (Frühlingsfest, Mitte März bis Mitte April)");
				session.send("-> Sommerdom (Hummelfest, Ende Juli bis Ende August)");
				next();
				break;
			
			case 'Reisepass beantragen':
				session.beginDialog("/passdialog");
				break;
			
			case 'Danke, nichts mehr':
				session.send('Okay %s... Wenn du noch Fragen hast, kannst du dich gerne bei mir melden!', session.userData.name);
				session.endDialogWithResult({response: 'end'});
				break;
		}
    }, 
	function (session, results) {
		session.replaceDialog('/maindialog', {repromt: true});
	}
]);

bot.dialog('/passdialog', [
	function (session){
		builder.Prompts.text(session, "Erstmal benötige ich deinen vollständigen Namen");
	},
	function (session, results) {
		session.userData.fullname = results.response;
		builder.Prompts.text(session, "Wie lautet deinen Adresse?");
	},
	function (session, results) {
		session.userData.address = results.response;
		builder.Prompts.text(session, "Und dein Geburtsdatum?");
	},
	function (session, results) {
		session.userData.birthday = results.response;
		builder.Prompts.attachment(session, "Jetzt benötige ich noch ein Bild von dir. (WICHTIG: Denke daran, dass es biometrisch sein muss und du nicht lachen darfst!)");
	},
	function (session, results) {
		session.userData.img = results.response;
		session.send("Danke! Überprüfe nochmal, ob deine Daten richtig sind");
		var checkList = session.userData.fullname + " - " + session.userData.address + " - " + session.userData.birthday;
		session.send(checkList);
		//session.send(session.userData.img);
		builder.Prompts.choice(session, "Ist alles korrekt?", ['Ja', 'Nein'], listStyle);
	},
	function (session, results) {
		session.userData.choice = results.response.entity
		if (session.userData.choice == 'Ja') {
			session.send("Super! Dein Reisepass ist in etwa 6 Wochen abholbereit.\nDu wirst denn per Post benachrichtigt");
			session.endDialog();
		}
		else {
			session.send("Schade! Versuchen wir es erneut...");
			session.replaceDialog('/passdialog', {repromt: true});
		}
	}
]);



