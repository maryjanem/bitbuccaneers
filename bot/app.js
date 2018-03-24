require('dotenv').load();
var express = require('express');
var builder = require('botbuilder');
var path = require('path');
var bodyParser = require('body-parser');
var botMiddleware = require('./middleware');
const app = express();
var router = express.Router();

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

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

bot.dialog('/', function(session){
    session.send('Could you try saying that in Pirate? My English is a bit rusty.');
});

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