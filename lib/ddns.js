var https = require('https');
var util = require('util');
var qs = require('querystring');
var co = require('co');
var thunkify = require('thunkify');
var common_params = {
  login_email: global.login_email,
  login_password: global.login_password,
  format: 'json'
};
var cfg = {};

/**
 * get domain info by name if provided
 * @param  {String} domain name
 * @return
 */
exports.getDomain = function (name, done) {
  var data = qs.stringify(common_params);
  var opts = {
    host: 'dnsapi.cn',
    path: '/Domain.List',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }
  };

  var result = '', domain;
  var req = https.request(opts, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      result += chunk;
    });
    res.on('end', function() {
      try {
        result = JSON.parse(result);
        if (result.status.code == '1') {
          if (name) {
            domain = result.domains.filter(function(domain) {
              return domain.name == name;
            })[0];
          } else {
            domain = result.domains[0];
          }
        } else {
          throw new Error(result.status.message);
        }
      } catch(e) {
        done(e);
      }

      if (domain) {
        cfg.domain_id = domain.id;
        done(null, domain);
      }
    });
  });

  req.write(data + '\n');
  req.end();
  req.on('error', function(e) {
    req.socket && req.socket.destroy();
    done(e);
  });
};

/**
 * get A record by domain id
 * @return
 */
exports.getARecord = function (done) {
  co(function *(){
    var getDomain = thunkify(exports.getDomain);
    if (!cfg.domain_id) yield getDomain(global.domain_name);

    var data = qs.stringify(util._extend(common_params, {domain_id: cfg.domain_id}));
    var opts = {
      host: 'dnsapi.cn',
      path: '/Record.List',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };
    var result = '', record;
    var req = https.request(opts, function(res){
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        result += chunk;
      });
      res.on('end', function(){
        try {
          result = JSON.parse(result);
          if (result.status.code == '1') {
            record = result.records.filter(function(record){return record.type == 'A'})[0];
            cfg.record_id = record.id;
            done(null, record);
          } else {
            throw new Error(result.status.message);
          }
        } catch(e) {
          done(e);
        }
      });
    });

    req.write(data + '\n');
    req.end();
    req.on('error', function(e){
      req.socket && req.socket.destroy();
      done(e);
    });
  })();
};


exports.updateARecord = function (done) {
  co(function *(){
    var getARecord = thunkify(exports.getARecord);
    if (!cfg.record_id) yield getARecord();

    var data = {
      domain_id: cfg.domain_id,
      record_id: cfg.record_id
    };
    data = qs.stringify(util._extend(util._extend(data, common_params), {
      sub_domain: '@',
      record_line: '\u9ed8\u8ba4' // 默认
    }));
    var opts = {
      host: 'dnsapi.cn',
      path: '/Record.Ddns',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };

    var result = '';
    var req = https.request(opts, function(res){
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        result += chunk;
      });
      res.on('end', function(){
        try {
          result = JSON.parse(result);
          if (result.status.code == '1') {
            done(null, result.record);
          } else {
            throw new Error(result.status.message);
          }
        } catch(e) {
          done(e);
        }
      });
    });

    req.write(data + '\n');
    req.end();
    req.on('error', function(e){
      req.socket && req.socket.destroy();
      done(e);
    });
  })();
};

