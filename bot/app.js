require('dotenv').load();
var express = require('express');
var builder = require('botbuilder');
var path = require('path');
var bodyParser = require('body-parser');
var botMiddleware = require('./middleware');
const app = express();
var router = express.Router();
var attractions = require("./Attractions.json")

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public') + "/" + "index.html");

    console.log("get / called")
});

app.get('/index.html', function (req, res) {
    console.log("get /index.html called")
    res.sendFile(path.join(__dirname, 'public') + "/" + "index.html");
});

app.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s started', app.name);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

app.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);

var recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f7c8e57c-b65e-4df4-b99f-8ca353ccc152?subscription-key=c42114c8555e4734b647600c989e3d58&verbose=true&timezoneOffset=0&q=");
bot.recognizer(recognizer);

bot.dialog('/', function(session){
    session.send('Could you try saying that in Pirate? My English is a bit rusty.');
});

var SelectedAttraction;
bot.dialog('Price', 
    function(session, args) {
        session.beginDialog('findTicketPrice', args)
    }).triggerAction({
        matches:'Price'
    });
        
bot.dialog('findTicketPrice', [
    function(session, args){
    var att = builder.EntityRecognizer.findEntity(args.intent.entities, 'TourismAttractions').entity;
        //if(builder.EntityRecognizer.findEntity(args.intent.entities, 'Tickets').entity !== null)
            //var ticket = builder.EntityRecognizer.findEntity(args.intent.entities, 'Tickets').entity;

        var found = false;
        if(att){
            //session.send(att)
            for (var i = 0; i < attractions.Attractions.length; i++){
                if(att === attractions.Attractions[i].Name){
                    found = true;
                    session.send("Found");
                    //if(ticket){
                      //  if(ticket === 'Concession')
                        //    session.endDialogWithResult("Ticket price is " + attractions.Attractions[i].Concession)
                        //if(ticket === 'Adult')
                        //    session.endDialogWithResult("Ticket price is " + attractions.Attractions[i].Adult)
                        //if(ticket === 'Child')
                        //    session.endDialogWithResult("Ticket price is " + attractions.Attractions[i].Child)
                    //}
                    //else{
                        session.conversationData.att = attractions.Attractions[i];
                        builder.Prompts.text(session, "What ticket type are you interested in? (Adult/Child/Concession)")
                        //}
                    }
                }
                if(found === false){
                    //session.send(att.getText());
                    session.send("We could not find that attraction in our list.");
                }
            }
            else{
                session.endConversation("Could not understand you, try again.")
            }
        },
        function(session, results){
            if(results.response === "Adult" || results.response === "adult"){
                session.endConversation("Ticket price is £" + session.conversationData.att.Adult)
            }
            else if(results.response === "Child" || results.response === "child"){
                session.endConversation("Ticket price is £" + session.conversationData.att.Child)
            }
            else if(results.response === "Concession" || results.response === "concession"){
                session.endConversation("Ticket price is £" + session.conversationData.att.Concession)
            }
            else{
                session.endConversation("Could not find that ticket")
            }
        }
])


bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.send(new builder.Message()
                    .text("Hello Human")
                    .suggestedActions(
                    builder.SuggestedActions.create(
                        null, [
                            builder.CardAction.imBack(null, "get started", "Get Started")
                        ]
                    ))
                    .address(message.address));
            }
        });
    }
});

bot.use({
    botbuilder: function (session, next) {
        botMiddleware.delayResponseTyping(session, 2);
        next();
    }
});