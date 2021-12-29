'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var minimist = require('minimist');
var events = require('events');
var debug = require('debug');
var log = require('./log');
var logsymbols = require('log-symbols');
var fsutil = require('./util');

var _require = require('child_process'),
    spawn = _require.spawn;

var PADDING = 20;

// CLI
//
// This class exposes various utilities for parsing options and logging purpose.
//
// - this.argv  - minimist result from options.argv or process.argv.slice(2)
// - this.debug - debug module logger, enabled with -d flag
// - this.alias - if defined, is used to parse arguments with minimist
// - this.env   - options.env or a clone of process.env
// - this.start - Timestamp marking instance creation, namely used to report
//                build time.
//
// And these static methods:
//
// - CLI.fail - to invoke with an error, log the error with npmlog error level
// - CLI.end  - Log options.success message with elapsed time as a parameter
//
// Options:
//
// - this.options.namespace - Define the debug namespace (eg. require('debug')(namespace)).
//                            Default: make:cli
// - this.options.success   - Success message to print with end()

var CLI = function (_events$EventEmitter) {
  _inherits(CLI, _events$EventEmitter);

  _createClass(CLI, [{
    key: 'example',
    get: function get() {
      return '';
    }

    // Used to parse arguments with minimist

  }, {
    key: 'alias',
    get: function get() {
      return {
        h: 'help',
        v: 'version',
        d: 'debug'
      };
    }

    // Used to generate the help output

  }, {
    key: 'flags',
    get: function get() {
      return {
        help: 'Show this help output',
        version: 'Show package version'
      };
    }
  }]);

  function CLI() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, CLI);

    var _this = _possibleConstructorReturn(this, (CLI.__proto__ || Object.getPrototypeOf(CLI)).call(this));

    _this.start = Date.now();

    _this.options = opts;
    _this.options.namespace = _this.options.namespace || 'make:cli';
    _this.options.success = _this.options.success || 'Build success in %sms';

    _this.options.name = _this.options.name || process.argv[1].split('/').slice(-1)[0];

    _this.argv = _this.parse(_this.options.argv);
    _this.args = _this.argv._.concat();
    _this.env = _this.options.env || Object.assign({}, process.env);

    if (_this.options.debug || _this.argv.debug) {
      debug.enable(_this.options.namespace);
    }

    _this.debug = debug(_this.options.namespace);
    return _this;
  }

  _createClass(CLI, [{
    key: 'parse',
    value: function parse() {
      var argv = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.argv.slice(2);
      var alias = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.alias;

      return minimist(argv, { alias: alias });
    }
  }, {
    key: 'exec',
    value: function exec(recipe) {
      var _this2 = this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { env: this.env, stdio: 'inherit' };

      return new Promise(function (r, errback) {
        // coming from https://github.com/npm/npm/blob/master/lib/utils/lifecycle.js#L222
        var sh = 'sh';
        var flags = '-c';

        if (process.platform === 'win32') {
          sh = process.env.comspec || 'cmd';
          flags = '/d /s /c';
          opts.windowsVerbatimArguments = true;
        }

        var args = [flags, recipe];
        _this2.debug('exec:', sh, flags, recipe);
        _this2.silly('env:', opts.env);
        spawn(sh, args, opts).on('error', errback).on('close', function (code) {
          if (code !== 0) {
            _this2.error(recipe);
            return errback(new Error('Recipe exited with code %d', code));
          }

          r();
        });
      });
    }
  }, {
    key: 'end',
    value: function end(cb) {
      var time = Date.now() - this.start;
      return CLI.end(this.options.success, time, cb);
    }
  }, {
    key: 'help',
    value: function help() {
      var _this3 = this;

      var targets = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var targetList = '';
      var leftpad = this.options.leftpad || '    ';
      if (Object.keys(targets).length) targetList += ' Targets:\n';

      var keys = Object.keys(targets);
      targetList += keys.map(function (t) {
        return leftpad + t + _this3.pad(t) + 'Run target ' + t;
      }).join('\n');

      var options = '';
      if (this.flags) {
        options += 'Options:\n';
        options += Object.keys(this.flags).map(function (flag) {
          return leftpad + '--' + flag + _this3.pad('--' + flag) + _this3.flags[flag];
        }).join('\n');
      }

      var opts = {
        example: this.example || this.options.example,
        name: this.options.name,
        commands: targetList,
        more: this.more,
        options: options
      };

      return CLI.help(opts);
    }
  }, {
    key: 'pad',
    value: function pad(str) {
      var padding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : PADDING;

      var len = padding - str.length;
      return new Array(len <= 1 ? 2 : len).join(' ');
    }

    // Help output
    //
    // Options:
    //
    // - name     - Used in the generated example (ex: $ name --help)
    // - example  - Used in the generated example instead of the default one
    // - options  - Used in the generated example instead of the default one

  }], [{
    key: 'help',
    value: function help() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      options.name = options.name || '';
      options.example = options.example || options.name + ' --help';

      console.log('\n  $ ' + options.example + '\n\n  ' + options.options);

      if (options.commands) console.log('\n', options.commands);
      if (options.more) console.log(options.more);

      console.log();
    }
  }, {
    key: 'fail',
    value: function fail(e, exit) {
      log.error.apply(log, arguments);
      if (exit) process.exit(isNaN(exit) ? 1 : exit);
    }
  }, {
    key: 'end',
    value: function end(message, time, cb) {
      log.info(message, time);
      cb && cb();
    }
  }]);

  return CLI;
}(events.EventEmitter);


CLI.PADDING = PADDING;

Object.assign(CLI.prototype, log);
Object.assign(CLI.prototype, fsutil);
export default CLI;
