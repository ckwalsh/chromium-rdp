var http = require('http');
var WebSocket = require('ws');

var ChromiumTab = require('./ChromiumTab');

function connectToWSForTab(tab, callback) {
  if (!tab.webSocketDebuggerUrl) {
    callback('No webSocketDebuggerUrl for tab', null);
    return;
  }
  
  var wsErrCb = function(err) {
    callback(err, null);
  };

  var ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.once('error', wsErrCb);
  ws.on('open', function() {
    ws.removeListener('error', wsErrCb);
    callback(null, ws);
  });
}

function ChromiumProc(options) {
  this.options = options;
}

ChromiumProc.prototype.listTabs = function (callback) {
  var self = this;
  
  var httpErrCb = function (err) {
    callback(err, null);
  };

  var req = http.get({
    host: self.options.host,
    port: self.options.port,
    path: '/json',
  }, function(res) {

    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      var tabs = JSON.parse(body);
      req.removeListener('error', httpErrCb);
      callback(null, tabs);
    });
  });

  req.once('error', httpErrCb);
};

ChromiumProc.prototype.connectToTab = function (tab, callback) {
  var self = this;

  if (typeof tab === 'string') {
    self.listTabs(function (err, tabs) {
      if (err) {
        callback(err, null);
        return;
      }

      var found = false;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === tab) {
          found = true;
          self.connectToTab(tabs[i], callback);
        }
      }

      if (!found) {
        callback('Unable to find tab with id '+tab, null);
      }
    });
  } else {
    connectToWSForTab(
      tab,
      function(err, ws) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, new ChromiumTab(tab, ws, self));
        }
      }
    );
  }
};

ChromiumProc.prototype.createTab = function (callback) {
  var self = this;
  
  var httpErrCb = function (err) {
    callback(err, null);
  };

  var req = http.get({
    host: self.options.host,
    port: self.options.port,
    path: '/json/new',
  }, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      var tab = JSON.parse(body);
      self.connectToTab(tab, callback);
    });
  });
  
  req.once('error', httpErrCb);
};

ChromiumProc.prototype.closeTab = function (tab, callback) {
  var self = this;
  
  if (typeof tab !== 'string') {
    tab = tab.id;
  }
  
  var httpErrCb = function (err) {
    callback(err, null);
  };

  var req = http.get({
    host: self.options.host,
    port: self.options.port,
    path: '/json/close/'+tab,
  }, function(res) {
    res.on('end', function() {
      res.removeListener('error', httpErrCb);
      callback(null, null);
    });
  });
  
  req.once('error', httpErrCb);
};

module.exports = ChromiumProc;
