
var express = require('express')
  , pg = require('pg')
  , _ = require('underscore')
  , config = require('config')
  , async = require('async')
  , format = require('pg-format');

var client = new pg.Client(config.get('DATABASE_URL'));
client.connect(function(err) {
  if (err) {
    console.log('could not connect to postgres', err);
  }
});

module.exports = (function() {
  'use strict';
  var api = express.Router();

  api.get('/power', function (req, res) {
    res.send('some json');
  });

  api.route('/test')
    .get(function (req, res) {
      res.send('hi! tku.');
    });

  //return all the symbols
  api.get('/stock', function (req, res) {
    client.query("SELECT replace(table_name,'s__','') title FROM information_schema.tables where table_name like 's\\_\\_%' ORDER BY table_schema,table_name"
      , function (err, result) {
        if (err) {
          res.send('error running query', err);
        }
        res.send(result);
      });
  });

  //return all the availble time(timestamp) slots
  api.get('/stock/all/:sym', function (req, res) {
    if (req.params.sym) {
      var SQL = 'SELECT EXTRACT(EPOCH FROM tstamp)*1000 tt,* from s__' + req.params.sym + ' order by tstamp';
      if (req.query.pick) {
        SQL = SQL.replace(',*',','+req.query.pick);
      }
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        if (req.query.pick)
          res.send(_.reduceRight(result.rows, function(a, b) {return a.concat([_.values(_.pick(b, ['tt'].concat(req.query.pick.split(','))))]);}, []))
        else res.send(result);
      });
    } else {
      res.send('sym required!');
    }
  });

//  /stock/daily/:sym?valuenames...
//    return all the availble last 2pm time(timestamp) slots
  api.get('/stock/daily/:sym', function (req, res) {
    if (req.params.sym) {
      var SQL = 'SELECT EXTRACT(EPOCH FROM tstamp)*1000 tt,* from s__' + req.params.sym + "  where date_part('hour', tstamp) = 13 and date_part('minute', tstamp) = 0 order by tstamp";
      if (req.query.pick) {
        SQL = SQL.replace(',*',','+req.query.pick);
      }
//      console.log(SQL);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        if (req.query.pick)
          res.send(_.reduceRight(result.rows, function(a, b) {return a.concat([_.values(_.pick(b, ['tt'].concat(req.query.pick.split(','))))]);}, []))
        else res.send(result);
      });
    } else {
      res.send('sym required!');
    }
  });

//  /stock/5m/:sym/:yymmdd?valuenames...
//  return all the availble 5 minute date points
  api.get('/stock/5m/:sym/:yymmdd', function (req, res) {
    if (req.params.sym && req.params.yymmdd && req.params.yymmdd.length == 6) {
      var ymd = '20'+req.params.yymmdd.substring(0,2)+'-'+req.params.yymmdd.substring(2,4)+'-'+req.params.yymmdd.substring(4,6);
      var SQL = 'SELECT EXTRACT(EPOCH FROM tstamp)*1000 tt,* from s__' + req.params.sym + " where date_trunc('day',tstamp) = '"+ymd+"' order by tstamp";
      if (req.query.pick) {
        SQL = SQL.replace(',*',','+req.query.pick);
      }
//      console.log(SQL);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        if (req.query.pick)
          res.send(_.reduceRight(result.rows, function(a, b) {return a.concat([_.values(_.pick(b, ['tt'].concat(req.query.pick.split(','))))]);}, []))
        else res.send(result);
      });
    } else {
      res.send('sym required!');
    }
  });

//  /contract/:sym/:yymmdd
//  return all the availble contracts names within a spec date
  api.get('/contract/:sym/:yymmdd', function (req, res) {
    if (req.params.sym && req.params.yymmdd && req.params.yymmdd.length == 6) {
      var SQL = "select distinct substring(contract, 0, position('C' in contract)) rtn from c__"+req.params.sym+'__'+req.params.yymmdd+' where position(\'C\' in contract) > 0 order by 1';
      console.log(SQL);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        res.send(_.reduceRight(result.rows, function(a, b) {
          return a.concat([b.rtn]);
        }, []));
      });
    } else {
      res.send('sym required!');
    }
  });

//  /contract/all/:sym/:yymmdd
//  return all the availble contracts details within a spec date
  api.get('/contract/all/:sym/:yymmdd', function (req, res) {
    if (req.params.sym && req.params.yymmdd && req.params.yymmdd.length == 6) {
      var ymd = '20'+req.params.yymmdd.substring(0,2)+'-'+req.params.yymmdd.substring(2,4)+'-'+req.params.yymmdd.substring(4,6);
      var SQL = 'select * from c__'+req.params.sym+'__'+req.params.yymmdd+' order by 1';
      if (req.query.pick) {
        SQL = SQL.replace(' * ',' ARRAY[EXTRACT(EPOCH FROM tstamp)*1000,'+req.query.pick+'] picked ');
      } else {
        SQL = SQL + ' limit 100';
      }
      console.log(SQL);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        if (req.query.pick)
          res.send(_.reduceRight(result.rows, function(a, b) {
//            console.log(b);
            return a.concat([b.picked]);
          }, []))
        else res.send(result);
      });
    } else {
      res.send('sym required!');
    }
  });

//  /contract/daily/:sym/:yymmdd?valuenames...
//    return all the availble contract details at last 2pm time(timestamp) slots
  api.get('/contract/daily/:sym/:yymmdd', function (req, res) {
    if (req.params.sym && req.params.yymmdd && req.params.yymmdd.length == 6) {
      var SQL = 'SELECT EXTRACT(EPOCH FROM tstamp)*1000 tt,* from c__'+req.params.sym+'__'+req.params.yymmdd+ "  where date_part('hour', tstamp) = 13 and date_part('minute', tstamp) = 0 order by tstamp";
      if (req.query.pick) {
        SQL = SQL.replace(',*',','+req.query.pick);
      }
      console.log(SQL);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        if (req.query.pick)
          res.send(_.reduceRight(result.rows, function(a, b) {return a.concat([_.values(_.pick(b, ['tt'].concat(req.query.pick.split(','))))]);}, []))
        else res.send(result);
      });
    } else {
      res.send('sym required!');
    }
  });

  Date.prototype.yymmdd = function() {
    var yy = (this.getYear()-100).toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    console.log('!!!',yy);
    return yy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
  };

  api.get('/premium/diff/:sym', function (req, res) {
    if (req.params.sym) {
      var SQL = format('SELECT * from s__%I order by tstamp', req.params.sym);
      client.query(SQL,  function (err, result) {
        if (err) {
          console.log('error running query', err);
          res.send('error running query', err);
        }
        var lastval = null;
        async.eachSeries(result.rows, function(item, cb) {
          if (lastval == null) {
            lastval = item;
            cb();
          } else {
            console.log('~',item);
            var ts1 = new Date(lastval.tstamp);
            var ts2 = new Date(item.tstamp);
            var SQL = format('select sum(diff) from ( ' +
            'select y.val-x.val diff from ' +
            '(select contract, (bid+ask)/2 val from c__%I__'+ts1.yymmdd()+' where tstamp = %L) x, ' +
            '(select contract,(bid+ask)/2 val from c__%I__'+ts2.yymmdd()+' where tstamp = %L) y ' +
            'where x.contract = y.contract ' +
            'and x.val is not null ' +
            'and y.val is not null ' +
            ') z ', req.params.sym, ts1, req.params.sym, ts2);

            console.log(SQL);
            client.query(SQL,  function (err, rtn) {
              console.log('~~',rtn);
              if (err) {
                console.log('error running subquery', err);
                cb('error running subquery: ' + err);
              } else {
                lastval = item;
                cb();
              }
            });
          }
        },function(err) {
          res.send(result);
        });
      });
    } else {
      res.send('sym required!');
    }
  });

  return api;
})();

/*


/contract/dp/:sym/:yymmddhh24miss
return all the availble contracts names within a spec data point

/options/:sym/:yymmdd?valuenames...
return all the availble contracts names within a spec date

/options/dp/:contract/:yymmddhh24miss?valuename...
return all the availble contracts names within a spec data point

 */
