var ChromiumProc = require('./ChromiumProc');

function ChromiumRDP(options, connectCb, errorCb) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 9222;

  var proc = new ChromiumProc(options);

  proc.listTabs(function () {
    connectCb(proc);
  }, function (err) {
    errorCb(err);
  });
}

module.exports = ChromiumRDP;
