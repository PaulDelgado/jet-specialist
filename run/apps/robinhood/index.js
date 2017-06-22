'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('robinhood');
var RHDataHelper = require('./rh_data_helper');

app.launch(function(req, res) {
  var prompt = 'For a quote, tell me a ticker symbol.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

// Check for an exit or cancel request
app.cancel(function(req, res, type) {
  if (type === 'SessionEndedRequest') {
    res.send('').shouldEndSession(true);
    return true;
  }
});

app.intent('quoteInfo', {
  'slots': {
    'SYMBOL': 'SYMBOLS'
  },
  'utterances': ['{quote} {|for|on} {|ticker|symbol} {-|SYMBOL}']
},
  function(req, res, type) {
    // Get the slot
    var symbol = req.slot('SYMBOL');
    // Set a reprompt value
    var reprompt = 'Tell me the symbol of a tradeable instrument to get quote data.';
    if (_.isEmpty(symbol)) {
      var prompt = 'I didn\'t hear a ticker symbol. Tell me which ticker symbol you\'d like me to quote for you.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else if (symbol === 'stop' || symbol === 'cancel' || symbol === 'exit') {
      type = 'SessionEndedRequest';
      res.say('Goodbye.').shouldEndSession(true);
      return true;
    } else {
      // console.log("RESPONSE PROPERTIES\n---");
      // console.log(Object.getOwnPropertyNames(res));
      var rhHelper = new RHDataHelper();
      rhHelper.requestQuote(symbol).then(function(quoteInfo) {
        console.log(quoteInfo);
        console.log("---");
        res.card(rhHelper.formatQuoteCard(quoteInfo));
        res.say(rhHelper.formatQuote(quoteInfo)).send();
      }).catch(function(err) {
        console.error("Error: " + err.stack);
        //console.log(Object.getOwnPropertyNames(err));
        var prompt = 'Sorry, I couldn\'t find data for ticker symbol <say-as interpret-as="spell-out">' + symbol + '</say-as>.';
        res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
      });
      return false;
    }
  }
);

app.intent('detailInfo', {
  'slots': {
    'SYMBOL': 'SYMBOLS'
  },
  'utterances': ['{detail|info} {|for|on} {|ticker|symbol} {-|SYMBOL}']
},
  function(req, res) {
    //get the slot
    var symbol = req.slot('SYMBOL');
    var reprompt = 'Spell the symbol for a tradeable financial instrument to get detailed information.';
    if (_.isEmpty(symbol)) {
      var prompt = 'I didn\'t hear a ticker symbol.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
      // console.log("RESPONSE PROPERTIES\n---");
      // console.log(Object.getOwnPropertyNames(res));
      var rhHelper = new RHDataHelper();
      rhHelper.requestQuote(symbol).then(function(detailInfo) {
        console.log("detailInfo Instrument: " + detailInfo.instrument);
        var instrument = detailInfo.instrument.split("/");
        console.log("Instrument ID: " + instrument[4]);
        rhHelper.getInstrument(instrument[4]).then(function(detailInfo) {
          console.log(detailInfo.body);
          console.log("---");
          //rhHelper.getFundamentals(detailInfo.body.symbol).then(function(fundamentalInfo) {
            res.card(rhHelper.formatDetailCard(detailInfo.body));
            res.say(rhHelper.formatDetail(detailInfo.body)).send();
          //});
        }).catch(function(err) {
          console.error("Error: " + err.stack);
          //console.log(Object.getOwnPropertyNames(err));
          var prompt = 'Sorry, I couldn\'t find data for ticker symbol <say-as interpret-as="spell-out">' + symbol + '</say-as>.';
          res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
        });
      });
      return false;
    }
  }
);

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;