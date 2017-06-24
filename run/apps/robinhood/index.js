'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('robinhood');
var RHDataHelper = require('./rh_data_helper');

app.launch(function(req, res) {
  var prompt = 'Say either quote or detail, then spell a ticker symbol.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('AMAZON.StopIntent', {
  'utterances': ['{stop|cancel}']
  },
  function(req, res) {
    res.say('Robin Hood closed.').shouldEndSession(true).send();
    return true;
  }
);

app.intent('AMAZON.HelpIntent', {
  'utterances': ['{help} {|me} {|get a quote|get company details}']
  },
  function(req, res) {
    res.say('This skill integrates me with the Robinhood <say-as interpret-as="spell-out">API</say-as> ' +
            'to give you real-time quotes, company details, and other market data. ' +
            'Try asking me for a quote or detail on a ticker symbol spelled out. ' +
            'Otherwise, say stop or cancel to close Robin Hood.').shouldEndSession(false).send();
    return true;
  }
);

app.intent('quoteInfo', {
  'slots': {
    'SYMBOL': 'SYMBOLS'
  },
  'utterances': ['{quote} {|for|on} {|ticker|symbol} {-|SYMBOL}']
  },
  function(req, res) {
    // Get the slot
    var symbol = req.slot('SYMBOL');
    console.log('intent.detailInfo().symbol: ' + symbol);
    // Set a reprompt value
    var reprompt = 'Say quote, then spell the symbol for a tradeable financial instrument to get a live quote.';
    if (_.isEmpty(symbol)) {
      var prompt = 'I didn\'t hear a ticker symbol.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
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
        var response = 'Sorry, I couldn\'t find data for ticker symbol <say-as interpret-as="spell-out">' + symbol + '</say-as>.';
        res.say(response).shouldEndSession(true).send();
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
    // Get the slot
    var symbol = req.slot('SYMBOL');
    console.log('intent.detailInfo().symbol: ' + symbol);
    // Set a reprompt value
    var reprompt = 'Say detail, then spell the symbol for a tradeable financial instrument to get detailed information.';
    if (_.isEmpty(symbol)) {
      var prompt = 'I didn\'t hear a ticker symbol.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
      return true;
    } else {
      // console.log("RESPONSE PROPERTIES\n---");
      // console.log(Object.getOwnPropertyNames(res));
      var rhHelper = new RHDataHelper();
      rhHelper.requestInstrument(symbol).then(function(detailInfo) {
        console.log(detailInfo);
        console.log("---");
        res.card(rhHelper.formatDetailCard(detailInfo));
        res.say(rhHelper.formatDetail(detailInfo)).send();
      }).catch(function(err) {
        console.error("Error: " + err.stack);
        var prompt = 'Sorry, I couldn\'t find data for ticker symbol <say-as interpret-as="spell-out">' + symbol + '</say-as>.';
        res.say(prompt).reprompt(reprompt).shouldEndSession(false).send();
      });
      return false;
    }
  }
);

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;