require('dotenv').load();
var express = require('express');
var builder = require('botbuilder');
var path = require('path');
var bodyParser = require('body-parser');
var botMiddleware = require('./middleware');
const app = express();
var router = express.Router();
var reviews = require('./reviews');

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
var bot = new builder.UniversalBot(connector, {
    localizerSettings: { 
        defaultLocale: "en" 
    }
}).set('storage', inMemoryStorage);

var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f7c8e57c-b65e-4df4-b99f-8ca353ccc152?subscription-key=c42114c8555e4734b647600c989e3d58&verbose=true&timezoneOffset=0&q=').onEnabled(function (context, callback) {
    var enabled = context.dialogStack().length == 0;
    callback(null, enabled);
});
//var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f7c8e57c-b65e-4df4-b99f-8ca353ccc152?subscription-key=c42114c8555e4734b647600c989e3d58&verbose=true&timezoneOffset=0&q=');
bot.recognizer(recognizer);

bot.dialog('/', function(session){
    session.send('Could you try saying that in Pirate? My English is a bit rusty.');
    //session.beginDialog('/localePicker');
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
 
/*bot.dialog('Greeting', function(session) {
    session.send('Welcome to Sparrows help corner!');
    session.endDialog();

 }).triggerAction({
    matches: /^hello*$|^hi*$/i,
});*/

 bot.dialog('/localePicker', [
    function (session) {
        // Prompt the user to select their preferred locale
        builder.Prompts.choice(session, "What's your preferred language?", 'English | Pirate');
    },
    function (session, results) {
        // Update preferred locale
        var locale;
        switch (results.response.entity) {
            case 'English':
                locale = 'en';
                break;
            case 'Pirate':
                locale = 'es';
                break;
        }
        session.preferredLocale(locale, function (err) {
            if (!err) {
                // Locale files loaded
                session.endDialog(`Your preferred language is now ${results.response.entity}`);
            } else {
                // Problem loading the selected locale
                session.error(err);
            }
        });
    }
]).triggerAction({
    matches: /^hello*$|^hi*$/i,
});

///////////////// SUBMIT & STORE REVIEW /////////////////////

bot.dialog('submitReviews', [
    function(session){
        session.beginDialog('submitReview');
    },
    
    function(session, results){
        session.conversationData.submit = results.response; 
        session.beginDialog("Thanks");
    }

]).triggerAction({
    matches: 'SubmitReview'
});

bot.dialog('submitReview', [
    function(session){
        builder.Prompts.text(session, session.localizer.gettext(session.preferredLocale(), "submit_option"))
    },
    function(session,results){
        session.endDialogWithResult(results);
    }
]);

bot.dialog('Thanks', [
    function(session){
        builder.Prompts.text(session, session.localizer.gettext(session.preferredLocale(), "thanks"))
    },
    function(session,results){
        session.endDialogWithResult(results);
    }
]);

//////////////// VIEW REVIEWS FROM JSON FILE //////////////////

bot.dialog('viewReviews', [
    function(session){
        session.beginDialog('seeReview');
    },
    
    function(session, results){
        session.conversationData.submit = results.response; 
    }

]).triggerAction({
    matches: 'SeeReviews'
});

bot.dialog('seeReview', [
    function(session){
        builder.Prompts.text(session, session.localizer.gettext(session.preferredLocale(), "view_option"))
    },
    function(session,results){
        //session.send(reviews["Titanic"].Review);
        console.log(reviews);
        
        session.send(reviews["Titanic"].Author + " said this about Titanic Museum \"" + reviews["Titanic"].Review + "\" and gave it " + reviews["Titanic"].Rating + "/5");
    },

]);