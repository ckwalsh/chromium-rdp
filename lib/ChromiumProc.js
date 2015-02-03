var http = require('http');
var WebSocket = require('ws');

var ChromiumTab = require('./ChromiumTab');

function connectToWSForTab(tab, successCb, errorCb) {
  if (!tab.webSocketDebuggerUrl) {
    errorCb('No webSocketDebuggerUrl for tab');
    return;
  }
  
  var wsErrCb = function(err) {
    errorCb(err);
  };

  var ws = new WebSocket(tab.webSocketDebuggerUrl);
  ws.once('error', wsErrCb);
  ws.on('open', function() {
    ws.removeListener('error', wsErrCb);
    successCb(ws);
  });
}

function ChromiumProc(options) {
  this.options = options;
}

ChromiumProc.prototype.listTabs = function (successCb, errorCb) {
  var self = this;
  
  var httpErrCb = function (err) {
    errorCb(err);
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
      successCb(tabs);
    });
  });

  req.once('error', httpErrCb);
};

ChromiumProc.prototype.connectToTab = function (tab, successCb, errorCb) {
  var self = this;

  if (typeof tab === 'string') {
    self.listTabs(function (tabs) {
      var found = false;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].id === tab) {
          found = true;
          self.connectToTab(tabs[i], successCb, errorCb);
        }
      }

      if (!found) {
        errorCb('Unable to find tab with id '+tab);
      }
    }, function (err) {
      errorCb(err);
    });
  } else {
    connectToWSForTab(
      tab,
      function(ws) {
        successCb(new ChromiumTab(tab, ws, self));
      }, function (err) {
        errorCb(err);
      }
    );
  }
};

ChromiumProc.prototype.createTab = function (successCb, errorCb) {
  var self = this;
  
  var httpErrCb = function (err) {
    errorCb(err);
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
      self.connectToTab(tab, successCb, errorCb);
    });
  });
  
  req.once('error', httpErrCb);
};

ChromiumProc.prototype.closeTab = function (tab, successCb, errorCb) {
  var self = this;
  
  if (typeof tab !== 'string') {
    tab = tab.id;
  }
  
  var httpErrCb = function (err) {
    errorCb(err);
  };

  var req = http.get({
    host: self.options.host,
    port: self.options.port,
    path: '/json/close/'+tab,
  }, function(res) {
    res.on('end', function() {
      res.removeListener('error', httpErrCb);
      successCb();
    });
  });
  
  req.once('error', httpErrCb);
};

module.exports = ChromiumProc;
