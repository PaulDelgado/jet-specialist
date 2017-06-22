'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var moment = require('moment');
var momenttz = require('moment-timezone');
var ENDPOINT = 'https://api.robinhood.com/';

function RHDataHelper() {
}

// Log raw response data
RHDataHelper.prototype.requestQuote = function(symbol) {
  return this.getQuote(symbol).then(
    function(response) {
      console.log('success - received quote info for ' + symbol);
      return response.body;
    }
  );
};

// Get basic quote data
RHDataHelper.prototype.getQuote = function(symbol) {
  var options = {
    method: 'GET',
    uri: ENDPOINT + 'quotes/' + symbol + '/',
    resolveWithFullResponse: true,
    json: true
  };
  return rp(options);
};

// Get detailed instrument data
RHDataHelper.prototype.getInstrument = function(instrument) {
  var options = {
    method: 'GET',
    uri: ENDPOINT + 'instruments/' + instrument + '/',
    resolveWithFullResponse: true,
    json: true
  };
  return rp(options);
};

// Get fundamental data
RHDataHelper.prototype.getFundamentals = function(symbol) {
  var options = {
    method: 'GET',
    uri: ENDPOINT + 'fundamentals/' + symbol + '/',
    resolveWithFullResponse: true,
    json: true
  };
  return rp(options);
};

// Format quote display card
RHDataHelper.prototype.formatQuoteCard = function(quoteInfo) {
  var card_est = moment.tz(quoteInfo.updated_at, 'America/New_York').format("YYYY-MM-DD h:mma z");
  var instrument = quoteInfo.instrument.split("/");
  var instrument_id = instrument[4];
  var card = ({
      "type":   "Standard",
      "title":  "Live Quote: " + quoteInfo.symbol,
      "text":   "Last Trade Price:   $" + quoteInfo.last_trade_price + 
                "\nChange:           $" + (quoteInfo.last_trade_price - quoteInfo.previous_close).toFixed(4) +
                "\nPrevious Close:   $" + quoteInfo.previous_close +
                "\n\nB: $" + quoteInfo.bid_price + "x" + quoteInfo.bid_size + " / A: $" + quoteInfo.ask_price + "x" + quoteInfo.ask_size +
                "\n\nUpdated: " + card_est,
      "image": {
        "smallImageUrl": "https://pbs.twimg.com/media/C7dZ2RlXgAAg3vS.jpg",
        "largeImageUrl": "https://cdn01.vulcanpost.com/wp-uploads/2017/04/141016-stockmarket-stock.jpg"
      }
  });
  console.log("Card built: " + Object.getOwnPropertyNames(card));
  return card;
};

// Format quote response
RHDataHelper.prototype.formatQuote = function(quoteInfo) {
  // Preparations using Moment to ease use of natural language abilities around the Date object
  // Robinhood returns UTC timestamps by default
  var utc = moment.tz(quoteInfo.updated_at, 'UTC').format("YYYY-MM-DD h:mma z");
  console.log('UTC: ' + utc);
  // Convert UTC to Eastern time
  var est = moment.tz(quoteInfo.updated_at, 'America/New_York').format("YYYY-MM-DD h:mma z");
  console.log('ET: ' + est);
  // Break out date and time components
  var date = est.split(" ");
  console.log('Date: ' + date);
  // Instrument URL redux
  var instrument = quoteInfo.instrument.split("/");
  var instrument_id = instrument[4];
  // Build the speech template to return basic info by default
  var basic = _.template('<say-as interpret-as="interjection"><prosody volume="x-loud">Yo!</prosody></say-as> ' +
                'The last price traded for <say-as interpret-as="spell-out">${symbol}</say-as> is $${last_trade_price}, ' +
                'updated as of <say-as interpret-as="date" format="ymd">${date}</say-as>, ' +
                '<say-as interpret-as="time">${time}</say-as>, ' +
                '<say-as interpret-as="spell-out">${timezone}</say-as>.')({
    symbol: quoteInfo.symbol,
    last_trade_price: quoteInfo.last_trade_price,
    date: date[0],
    time: date[1],
    timezone: date[2],
    instrument: instrument_id,
  });
  // First we handle some special conditions
  if (quoteInfo.trading_halted === 'true') {
    // Trading is halted as of the time quote was retrieved
    //var template = _.template('<say-as interpret-as="interjection">Attention!</say-as> There is a trading halt on ${symbol}. ${basic}');
    return _.template('<say-as interpret-as="interjection">Attention!</say-as> There is a trading halt on ${symbol}. ${basic}')({
      symbol: quoteInfo.symbol,
      basic: basic
    });
  } else if (quoteInfo.has_traded === 'false') {
    // Has not traded in the latest session
    return _.template('Note: ${symbol} has not traded in the latest session. ${basic}')({
      symbol: quoteInfo.symbol,
      basic: basic
    });
  } else {
    // Our basic quote response
    return _.template('${basic}')({
      basic: basic
    });
  }
};

// Format detailed info card
RHDataHelper.prototype.formatDetailCard = function(detailInfo) {
  var card = ({
      "type":   "Standard",
      "title":  "Detailed Info: " + detailInfo.symbol,
      "text":   "Name: " + detailInfo.name + 
                "\nBloomberg ID: " + detailInfo.bloomberg_unique +
                "\nList Date: " + detailInfo.list_date +
                "\nStatus: " + detailInfo.state +
                "\nTradeable: " + detailInfo.tradeable +
                "\nInstrument ID: " + detailInfo.id,
      "image": {
        "smallImageUrl": "https://pbs.twimg.com/media/C7dZ2RlXgAAg3vS.jpg",
        "largeImageUrl": "https://cdn01.vulcanpost.com/wp-uploads/2017/04/141016-stockmarket-stock.jpg"
      }
  });
  console.log("Card built: " + Object.getOwnPropertyNames(card));
  return card;  
};

// Format detailed info response
RHDataHelper.prototype.formatDetail = function(detailInfo) {
  var tradeable = detailInfo.tradeable;
  if (tradeable === true) { tradeable = "tradeable"; } else { tradeable = "not tradeable"; }
  console.log("Tradeable: " + tradeable);
  // Build the speech template to return basic info by default
  var basic = _.template('<say-as interpret-as="interjection"><prosody volume="x-loud">Lookup successful!</prosody></say-as> ' +
                'Symbol <say-as interpret-as="spell-out">${symbol}</say-as> represents ${name}. ' +
                'The original listing date is ${list_date}. This issue has a status of ${status}, ' +
                'and is currently ${trading}.')({
    symbol: detailInfo.symbol,
    name: detailInfo.name,
    list_date: detailInfo.list_date,
    status: detailInfo.state,
    trading: tradeable,
    instrument: detailInfo.id,
  });
  return _.template('${basic}')({
    basic: basic
  });  
};

module.exports = RHDataHelper;