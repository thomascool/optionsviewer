var async = require('async'),
  _ = require('underscore'),
  pg = require('pg'),
  pgX = require('pg');

var QueryStream = require('pg-query-stream')
var JSONStream = require('JSONStream')
var config = require('config')

var concat = require('concat-stream')
var through = require('through')

diff = {};

pg.connect(config.get('dbConfig') ,function(err, client, done) {
  if(err) throw err;
  client.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' AND table_type=\'BASE TABLE\' AND table_name like \'c__spx_x__15%\' order by 1 limit 10000 ', function(err, result) {
    //call `done()` to release the client back to the pool
    done();

    if(err) {
      return console.error('error running query', err);
    }
    async.eachSeries(result.rows, function(item, cb) {
      pgX.connect(config.get('dbConfig') ,function(err, clientX, doneX) {
        if(err) throw err;
        var sqlstr = 'SELECT contract, bid,ask,last FROM ' + item.table_name + ' WHERE bid is not null and ask is not null';
        var query = new QueryStream(sqlstr);
        var stream = clientX.query(query);
        console.log(item);
        doneX();

        stream.on('end', cb)

        stream.pipe(through(function (row) {
          row.final = null;
          if (_.isNumber(row.last)) {
            row.final = row.last;
          } else {
            if (_.isNumber(row.bid) && _.isNumber(row.ask))
              row.final = Math.round(((row.ask+row.bid) / 2) * 100) / 100
          }

          var key = row.contract.replace('.', '_')
          if (diff[key] && _.isNumber(row.final)) {
            diff[key].val = diff[key].val + Math.abs(diff[key].prior - row.final);
            diff[key].prior = row.final;
          } else {
            if (_.isNumber(row.final)) {
              diff[key] = {val:0, prior:row.final, contract: key};
            }
          }

        }))
      });
    }, function(finalResult) {
      _.each(_.filter(diff, function(num,key){ return num.val > 1; }), function (item, key) {
        console.log(item.contract + '|' + item.val);
      });
      done(finalResult);

    });

  });
})

