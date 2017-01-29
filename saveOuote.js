var async = require('async'),
  _ = require('underscore')
  pg = require('pg'),
  QueryStream = require('pg-query-stream'),
  JSONStream = require('JSONStream'),
  config = require('config'),
  writeJsonFile = require('write-json-file');

if (config.get('marketHours') == 1) {
  // it only run between 6:00am and 13:31pm
  var dt = new Date();
  if (((dt.getHours()*100 + dt.getMinutes()) <= 600) || ((dt.getHours()*100 + dt.getMinutes()) >= 1331)) {
 //   console.log('Out of market hours!');
//    process.exit(0);
  }
}

//  stockList : ['UVXY','SVXY','SPY','SPXL','SPLS','$SPX.X'],

//async.eachSeries(['SPXL','SPXS'], function(item, ecb) {
//async.eachSeries(['SPXL', 'SPXS'], function(item, ecb) {
async.map(config.get('stockList.full'), function(item, ecb) {
  var qQuote = require('./lib/getOptionsQuote');
  var con;
   qQuote.getOptionsQuote(item, undefined, function(err, allData, stockTick) {
     var YYMMDD = (stockTick.createdDate.getFullYear().toString().substr(2,2) + '' + ('0'+(stockTick.createdDate.getMonth()+1)).slice(-2) + '' + ('0'+(stockTick.createdDate.getDate())).slice(-2));

     if (err) {
       ecb(err);
     } else {
       async.waterfall([
         function(xcb) {
           writeJsonFile('exp/'+ stockTick.symbol +'~'+ stockTick.timeStamp + '.json', stockTick ).then(() => {
             writeJsonFile('exp/'+ stockTick.symbol +'_'+ stockTick.timeStamp + '.json', allData ).then(() => {
                 console.log('dumped json : '+ stockTick.symbol +'_'+ stockTick.timeStamp + '.json');
                 xcb();
             });
           });
         },
         function(xcb) {
           con = new pg.Client(config.get('dbConfig'));
           con.connect(function (err) {
               if (err) console.log(err);
               xcb(err);
           });
         },
         function(xcb) {
           con.query('CREATE TABLE IF NOT EXISTS s__'+stockTick.symbol+
             ' ( id serial NOT NULL, symbol character varying(32) NOT NULL,' +
             ' bid double precision, ask double precision, last double precision,' +
             ' change double precision, basize character varying(32), high double precision,' +
             ' low double precision, volume bigint, delta100 integer, tstamp timestamp with time zone NOT NULL)'
           ).on('end', function(){
               console.log("Created stock table :", 's__'+stockTick.symbol);
               async.each([stockTick],function(tick, cb) {
                 var qStr = "insert into s__"+tick.symbol+" (symbol, bid, ask, last, change, basize, high, low, volume, delta100, tstamp) values('"
                   +tick.symbol + "', "
                   +tick.bid +  ",  "
                   +tick.ask +  ", "
                   +tick.last + ", "
                   +tick.change + ", '"
                   +tick.BAsize + "', "
                   +tick.high + ", "
                   +tick.low + ", "
                   +parseInt(tick.volume,10) + ", null, '"
                   +tick.createdDate.toUTCString()
                   + "') RETURNING * "
                 return con.query(qStr, function(err, data) {
                   cb(err);
                 });
               }, function(err) {
                 console.log('Stock tick inserted : ', 's__'+stockTick.symbol);
                 if (err)
                   console.log('Stock insert error : ',err);
                 xcb(err)
               });
             });
         },
         function(xcb) {
           con.query('CREATE TABLE IF NOT EXISTS c__'+stockTick.symbol+'__'+ YYMMDD +
             ' ( id serial NOT NULL, contract character varying(32) NOT NULL, title character varying(48), act smallint,' +
             ' strike double precision, ' +
             ' bid double precision, ' +
             ' ask double precision, ' +
             ' iv double precision, ' +
             ' theo double precision, ' +
             ' delta double precision, ' +
             ' gamma double precision, ' +
             ' theta double precision, ' +
             ' vega double precision, ' +
             ' rho double precision, ' +
             ' last double precision, ' +
             ' change double precision, ' +
             ' vol bigint, ' +
             ' opint double precision, ' +
             ' tstamp timestamp with time zone NOT NULL)'
           ).on('end', function(){
               var cnt = 0;
               console.log("Created contracts table :", 'c__'+stockTick.symbol+'__'+ YYMMDD);
               async.each(_.toArray(allData),function(tick, cb) {
                 console.log("~~~", tick.createdDate.toUTCString(), '^^^', tick.createdDate );

                 con.query("insert into c__"+stockTick.symbol+"__" +YYMMDD+
                 " (contract, title, act, strike, bid, ask, iv, theo, delta, gamma, theta, vega, rho, last, change, vol, opint, tstamp) values('"
                 +tick.contract + "', '"
                 +tick.title + "', '"
                 +tick.action + "', '"
                 +tick.strike + "',"
                 +tick.bid + ","
                 +tick.ask + ","
                 +tick.IV + ","
                 +tick.Theo + ","
                 +tick.Delta + ","
                 +tick.Gamma + ","
                 +tick.Theta + ","
                 +tick.Vega + ","
                 +tick.Rho + ","
                 +tick.last + ","
                 +tick.change + ","
                 +parseInt(tick.vol,10) + ","
                 +tick.opInt + ", '"
                 +tick.createdDate.toUTCString()
                 + "')", function(err) {
                   if (err) {
                     console.log("insert into c__" +stockTick.symbol+'__'+YYMMDD+
                     " (contract, title, act, strike, bid, ask, iv, theo, delta, gamma, theta, vega, rho, last, change, vol, opint, tstamp) values('"
                     +tick.contract + "', '"
                     +tick.title + "', '"
                     +tick.action + "', '"
                     +tick.strike + "',"
                     +tick.bid + ","
                     +tick.ask + ","
                     +tick.IV + ","
                     +tick.Theo + ","
                     +tick.Delta + ","
                     +tick.Gamma + ","
                     +tick.Theta + ","
                     +tick.Vega + ","
                     +tick.Rho + ","
                     +tick.last + ","
                     +tick.change + ","
                     +parseInt(tick.vol,10) + ","
                     +tick.opInt + ", '"
                     +tick.createdDate.toUTCString()
                     + "')");
                     console.log(tick);
                     console.log('contract insert error : ', err)
                   }
                   cnt++;
                   cb(err);
                 });
               }, function(err) {
                 if (err) console.log(err);
                 console.log("Contracts inserted (%d): %s", cnt,  'c__'+stockTick.symbol+'__'+ YYMMDD);
                 xcb();
               });
             });
         }
       ], function (error) {

         con.end();
         ecb();
       });

     }
   });
 }, function(err) {
  if (err)
   console.log('bigbig problems : ', err);
 });
