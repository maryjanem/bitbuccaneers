require('dotenv').load();
var express = require('express');
var builder = require('botbuilder');
var path = require('path');
var bodyParser = require('body-parser');
var botMiddleware = require('./middleware');
const app = express();
var router = express.Router();
var reviews = require('./reviews');
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
var bot = new builder.UniversalBot(connector, {
    localizerSettings: { 
        defaultLocale: "en" 
    }
}).set('storage', inMemoryStorage);

var recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/f7c8e57c-b65e-4df4-b99f-8ca353ccc152?subscription-key=c42114c8555e4734b647600c989e3d58&verbose=true&timezoneOffset=0&q=");
bot.recognizer(recognizer);

bot.dialog('/', function (session) {
    session.send('Could you try saying that in Pirate? My English is a bit rusty.');
    //session.beginDialog('/localePicker');
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
        var found = false;
        if(att){
            for (var i = 0; i < attractions.Attractions.length; i++){
                if(att === attractions.Attractions[i].Name){
                    found = true;
                    session.conversationData.att = attractions.Attractions[i];
                    builder.Prompts.text(session, "What ticket type are you interested in? (Adult/Child/Concession)")
                    }
                }
                if(found === false){
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
                var card = new builder.HeroCard(null)
                    .text("Ahoy! I'm Sparrow, your chatbot guide to Northern Ireland! What can I help you with today?")
                    .images([
                        builder.CardImage.create(null, 'https://i.imgur.com/rFiOPeS.png')
                    ]);
                bot.send(new builder.Message().addAttachment(card).address(message.address));
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
        console.log(reviews["Titanic"][0].Author)
        for(var i = 0; i < reviews["Titanic"].length; i++){
            session.send(reviews["Titanic"][i].Author + " said this about Titanic Museum \"" + reviews["Titanic"][i].Review + "\" and gave it " + reviews["Titanic"][i].Rating + "/5");
        }
        
    },

]);

bot.dialog('Recommendations', function (session, args) {
    var city = builder.EntityRecognizer.findEntity(args.intent.entities, 'City').entity;
    if (city) {
        if (city === 'belfast') {
            session.send('I love a wee trip to Titanic Museum 🚢 to hear a story about the greatest ship of all time! But here are some other recommendations too 😁');
            var reply = new builder.Message(session)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(getBelfastRecs());

            session.send(reply);

        }
    } else {
        session.send('The locals are quite fond of The Dirty Onion. Personally, I love a wee pint at Katy\'s Cellars.')
    }
}).triggerAction({
    matches: 'Recommendation'
});



function getBelfastRecs(session) {
    return [
        new builder.HeroCard(session)
            .title('Titanic Museum')
            .text('Titanic Belfast is the World\'s largest Titanic visitor experience and must-see attraction in Northern Ireland!')
            .images([
                builder.CardImage.create(session, 'https://media-cdn.tripadvisor.com/media/photo-s/03/bc/05/ac/titanic-belfast.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, "https://titanicbelfast.admit-one.eu/", 'Buy Tickets'),
                builder.CardAction.imBack(session, "prices", 'Prices'),
            ]),
            new builder.HeroCard(session)
            .title('Belfast Pub Crawl')
            .text('Belfast Pub Crawl will take you out for an evening full of great bars, drinks, traditional Irish music and of course, plenty of craic! 🍺  It runs on Fridays and Saturdays from 8pm.')
            .images([
                builder.CardImage.create(session, 'https://d5qsyj6vaeh11.cloudfront.net/images/destinations/important%20places/irish%20pubs/article%20images/c112_f_main.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, "https://titanicbelfast.admit-one.eu/", 'Find Out More')
            ])
    ];
}
