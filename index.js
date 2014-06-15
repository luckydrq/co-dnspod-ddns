var co = require('co');
var ip = require('./lib/ip');
var ddns = require('./lib/ddns');
var getip = ip.getip;
var current_ip, timeout;

module.exports = function boot(t) {
  timeout = timeout || t;

  co(function *(){
    var ip = yield getip();

    if (current_ip == ip) {
      console.log('%s ip: [%s], not change!', now(), ip);
    } else {
      current_ip = ip;
      var record = yield ddns.updateARecord(ip);
      console.log('%s %s', now(), record.value);
    }

    setTimeout(boot, timeout);

  })(function(err){
    if (err) {
      console.error(err.message);
    }
  });
  function doDDNS() {
    getip()
      .then(function(ip) {
        if (isValidIP(ip)) {
          if (current_ip == ip) {
            console.log('%s ip: [%s], not change!', now(), ip);
          } else {
            current_ip = ip;
            return ddns.updateARecord(ip);
          }
        } else {
          throw new Error('Invalid IP!');
        }
      })
      .then(function(record) {
        if (record) {
          console.log('%s %s', now(), record.value);
        }
      })
      .fail(function(err) {
        console.error('%s %s', now(), err.message);
      })
      .fin(function(){
        setTimeout(doDDNS, timeout);
      });
  }

  doDDNS();
};

function now(){
  var now = new Date();
  var year = normalize(now.getFullYear());
  var month = normalize(now.getMonth() + 1);
  var day = normalize(now.getDate());
  var hour = normalize(now.getHours());
  var minute = normalize(now.getMinutes());
  var second = normalize(now.getSeconds());
  
  return [[year, month, day].join('-'), [hour, minute, second].join(':')].join(' ');
}

function normalize(num) {
  if (num < 10) return '0' + num;
  else return num;
}

