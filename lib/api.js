
var express = require('express')
  , pg = require('pg')
  , _ = require('underscore')
  , config = require('config');

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

  return api;
})();

/*


/stock/dp/:sym/:yymmddhh24miss?valuenames...
return all the availble 5 minute date points

/contract/:sym/:yymmdd
return all the availble contracts names within a spec date

/contract/dp/:sym/:yymmddhh24miss
return all the availble contracts names within a spec data point

/options/:sym/:yymmdd?valuenames...
return all the availble contracts names within a spec date

/options/dp/:contract/:yymmddhh24miss?valuename...
return all the availble contracts names within a spec data point

 */