var ChromiumProc = require('./ChromiumProc');

function ChromiumRDP(options, callback) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 9222;

  var proc = new ChromiumProc(options);

  proc.listTabs(function (err, results) {
    callback(err, proc);
  });
}

module.exports = ChromiumRDP;
