var async = require('async'),
  cheerio = require('cheerio'),
  _ = require('underscore'),
  config = require('config');

var qQuote = require('./lib/getOptionsQuote');

var buildURL= function(symbol) {
  return {
    url: config.get('webRequest.urlRealTime') + "?symbol="+symbol,
    headers: config.get('webRequest.headers')
  }
}

qQuote.requestURL(buildURL('AAPL')  , function(err, data) {
  var $ = cheerio.load(data);
  console.log($('amtd').text());
});
