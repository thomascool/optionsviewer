var async = require('async'),
  _ = require('underscore')
  pg = require('pg'),
  fs = require('fs'),
  QueryStream = require('pg-query-stream'),
  JSONStream = require('JSONStream'),
  config = require('config');

var rootPath = '/Users/wku/Desktop/RB/databackup/loadtest/html/20150225'
var Looking4Key = 'UVXY';

if (process.argv.length == 4) {
    rootPath = process.argv[2];
    Looking4Key = process.argv[3];
} else {
    console.log(process.argv, '<html rootPath>','<ticket symbol>');
    process.exit(1);
}

var allfnames = _.map(fs.readdirSync(rootPath), function(item) {
  var tmp = item.split("^");
  return {
    fname: tmp[0],
    tStamp: tmp[1],
    fullpath: rootPath +'/'+ item
  }
});


// pick the stocks by code
var step1 =  _.filter(allfnames, function(item){
    console.log( item.fname.substring(0,6) );
    return item.fname.substring(0,Looking4Key.length) == Looking4Key;
});

// sort by tStamp
var step2 = _.sortBy(step1, function(item){
  return item.tStamp;
})

var allFname = {}
_.each(step2, function(item) {
  var tmpNum = item.tStamp.substring(0,8);
  if (typeof allFname[tmpNum] === 'undefined') allFname[tmpNum] = [];
  allFname[tmpNum].push(item);
});

allFname = _.filter(allFname, function(val, key) {
  var tmp = _.filter(val, function(item){
    return item.fname == Looking4Key;
  });
  return (val.length == 3 && tmp.length == 1);
})


console.log( allFname );


//async.each(config.get('stockList.full'), function(item, ecb) {
async.eachSeries(allFname, function(item, ecb) {

//?  console.log('~~~', item);
  var qQuote = require('./lib/getOptionsQuote');
  var con;
   qQuote.getOptionsQuote(Looking4Key, item, function(err, allData, stockTick) {
     var YYMMDD = (stockTick.createdDate.getFullYear().toString().substr(2, 2) + '' + ('0' + (stockTick.createdDate.getMonth() + 1)).slice(-2) + '' + ('0' + (stockTick.createdDate.getDate())).slice(-2));

     async.waterfall([
       function (xcb) {
         con = new pg.Client(config.get('dbConfig'));
         con.connect();
         xcb();
       },
       function (xcb) {
  //?       console.log("STOCK MESSAGE :", 's__' + stockTick.symbol);

         async.each([stockTick], function (tick, cb) {
           var qStr = "insert into s__" + tick.symbol + " (symbol, bid, ask, last, change, basize, high, low, volume, tstamp) values('"
               + tick.symbol + "', "
               + tick.bid + ",  "
               + tick.ask + ", "
               + tick.last + ", "
               + tick.change + ", '"
               + tick.BAsize + "', "
               + tick.high + ", "
               + tick.low + ", "
               + parseInt(tick.volume, 10) + ", '"
               + tick.createdDate.toUTCString()
               + "') RETURNING * ";

    //?       console.log(qStr);
           xcb();
         });

       },
       function (xcb) {

         var cnt = _.toArray(allData).length;
           console.log("CONTRACT MESSAGES :", 'c__' + stockTick.symbol + '__' + YYMMDD, cnt);
         async.each(_.toArray(allData), function (tick, cb) {
             /* ?

           console.log("insert into c__" + stockTick.symbol + '__' + YYMMDD +
               " (contract, title, act, strike, bid, ask, iv, theo, delta, gamma, theta, vega, rho, last, change, vol, opint, tstamp) values('"
               + tick.contract + "', '"
               + tick.title + "', '"
               + tick.action + "', '"
               + tick.strike + "',"
               + tick.bid + ","
               + tick.ask + ","
               + tick.IV + ","
               + tick.Theo + ","
               + tick.Delta + ","
               + tick.Gamma + ","
               + tick.Theta + ","
               + tick.Vega + ","
               + tick.Rho + ","
               + tick.last + ","
               + tick.change + ","
               + parseInt(tick.vol, 10) + ","
               + tick.opInt + ", '"
               + tick.createdDate.toUTCString()
               + "')");

             */

           cnt--;
           if (cnt == 0) xcb();
         });

       }], function (error) {
       con.end();
       ecb();
     });

   }, function(err) {
     if (err)
       console.log('bigbig problems : ', err);
   })
})
