var async = require('async'),
  cheerio = require('cheerio'),
  _ = require('underscore'),
  request = require('request'),
  config = require('config');

var qQuote = require('./lib/getOptionsQuote');

var buildURL= function(symbol) {
  return {
    url: config.get('webRequest.urlRealTime') + "?symbol="+symbol,
    headers: config.get('webRequest.headers')
  }
}

var countryCode = '+1',
    message = 'Hello from KeepAlive';

qQuote.requestURL(buildURL('AAPL')  , function(err, data) {
  var $ = cheerio.load(data);
  console.log( $('amtd').text() );

  if ($('amtd').text().length < 30) {
    request.post({
      headers: {
        'content-type' : 'application/x-www-form-urlencoded',
        'Accepts': 'application/json'
      },
      url:     config.get('blower') + '/messages',
      form:    {
        to: countryCode + config.get('mobileNumber'),
        message: message
      }
    }, function(error, response, body){
      if (!error && response.statusCode == 201)  {
        console.log('Message sent!')
      } else {
        var apiResult = JSON.parse(body)
        console.log('Error was: ' + apiResult.message)
      }
    })
  }

});



