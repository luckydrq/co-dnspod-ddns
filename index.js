var co = require('co');
var thunkify = require('thunkify');
var getip = thunkify(require('./lib/ip').getip);
var updateARecord = thunkify(require('./lib/ddns').updateARecord);

var current_ip, timeout;

module.exports = function boot(t) {
  timeout = timeout || t;

  co(function *(){
    var ip = yield getip();

    if (current_ip == ip) {
      console.log('%s ip: [%s], not change!', now(), ip);
    } else {
      current_ip = ip;
      var record = yield updateARecord();
      console.log('%s %s', now(), record.value);
    }
  })(function(err){
    if (err) {
      console.error(err.message);
    } else {
      setTimeout(boot, timeout);
    }
  });
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

