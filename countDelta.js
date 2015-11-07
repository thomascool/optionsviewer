var async = require('async'),
  _ = require('underscore')
  pg = require('pg'),
  config = require('config');

var client = new pg.Client(config.get('dbConfig'));

client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  var tot_tname = config.get('stockList.full').length;

  async.waterfall([
    function(cb) {
      var rtn = [];
      _.each(config.get('stockList.full'), function(item) {
        var tname = item.replace("$","").replace(".","_").toLowerCase();

        client.query("SELECT distinct to_char(tstamp, 'YYMMDD') daily FROM s__"+tname+" WHERE delta100 is null", function(err, result) {
          if (err) cb(err);
          rtn.push({tname : tname, rows : result.rows});
          tot_tname--;
          if (tot_tname == 0) cb(null, rtn);
        });
      })
    },
    function(rtn, cb) {
      console.log(JSON.stringify(rtn))
      var tot_size = 0;
      async.each(rtn, function(l1) {
        var tname = l1.tname;
        tot_size = tot_size + l1.rows.length;
        async.each(l1.rows, function (l2) {
          var SQL = "update s__"+tname+" as x set delta100 = (select count(*) from c__"+tname+"__"+l2.daily+
              " where act = 1 and delta is not null and delta = 1 and x.tstamp = tstamp) "+
              " where delta100 is null and to_char(tstamp, 'YYMMDD') = '"+l2.daily+"'";
          console.log(tname, l2.daily, SQL);
          client.query(SQL, function(err, result) {
            if (err) cb(err);
            tot_size--;
            if (tot_size == 0) cb(null);
          });
        });
      });
    }
  ], function (error) {
      if (error) console.error('error running query', error);
    client.end();
  });







});

