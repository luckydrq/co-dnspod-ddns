var net = require('net');
var thunkify = require('thunkify');

exports.getip = thunkify(function(done) {
  var ip = '';
  var client = net.connect({
    port: 6666,
    host: 'ns1.dnspod.net'
  });
  
  client.setEncoding('utf8');
  client.on('data', function(chunk) {
    ip += chunk;
  });
  client.on('end', function() {
    if (!isValidIP(ip)) done(new Error('Invalid IP!'));
    else done(null, ip);
  });
  client.on('error', function(err) {
    client.destroy();
    done(err);
  });
});

function isValidIP(ip) {
  return net.isIPv4(ip) || net.isIPv6(ip);
};
