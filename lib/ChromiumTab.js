var util = require('util');
var events = require('events');

function ChromiumTab(tab, ws, proc) {
  var self = this;
  this.tab = tab;
  this._ws = ws;
  this._proc = proc;
  this._cmdIdx = 0;
  this._cmdCbs = {};

  ws.on('message', function(data) {
    var resp = JSON.parse(data);
    if ('id' in resp && resp.id != null) {
      var id = resp.id;
      if (id in self._cmdCbs) {
        self._cmdCbs[id](resp.error, resp.result);
        delete self._cmdCbs[id];
      }
    } else if ('method' in resp) {
      self.emit('notification', resp);
      self.emit(resp.method, resp.error, resp.params);
    } else {
      self.emit('error', resp);
    }
  });
}

util.inherits(ChromiumTab, events.EventEmitter);

ChromiumTab.prototype.send = function(method, params, cb) {
  var self = this;
  
  if (cb === undefined) {
    cb = params;
    params = undefined;
  }

  var cmd = {
    id: self._cmdIdx++,
    method: method,
  };

  if (params) {
    cmd.params = params;
  }

  self._ws.send(JSON.stringify(cmd));

  if (cb) {
    self._cmdCbs[cmd.id] = cb;
  }
};

ChromiumTab.prototype.disconnect = function(cb) {
  var self = this;
  self._ws.once('close', function() {
    self._ws = null;
    cb();
  });
  self._ws.close();
};

ChromiumTab.prototype.close = function(callback) {
  var self = this;
  self.disconnect(function() {
    self._proc.closeTab(self.tab, callback);
  });
};

module.exports = ChromiumTab;
