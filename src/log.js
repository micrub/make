'use strict';

var chalk = require('chalk');
var npmlog = require('npmlog');
var prefix = 'make';

var _require = require('util'),
    format = _require.format;

var _require2 = require('log-symbols'),
    error = _require2.error,
    info = _require2.info,
    success = _require2.success,
    warning = _require2.warning;

var log = module.exports = npmlog;
log.heading = prefix;

// Automatic silent prefix
Object.keys(log.levels).forEach(function (lvl) {
  log[lvl] = log[lvl].bind(log, '');
});

// Few logsymbols log helper
log.success = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var msg = format.apply(null, args);
  var level = chalk.green('info');
  var symbol = success;
  console.error(log.heading + ' ' + symbol + ' ' + level + ' ' + msg);
};

log.warning = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  var msg = format.apply(null, args);
  var level = chalk.yellow('warn');
  var symbol = warning;
  console.error(log.heading + ' ' + symbol + ' ' + level + ' ' + msg);
};

// let _info = log.info;
log.info = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  var msg = format.apply(null, args);
  var level = chalk.green('info');
  var symbol = info;
  console.error(log.heading + ' ' + symbol + ' ' + level + ' ' + msg);
};

log.error = function () {
  for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  var msg = format.apply(null, args);
  var level = chalk.red('ERR ');
  var symbol = error;
  console.error(log.heading + ' ' + symbol + ' ' + level + ' ' + msg);
};