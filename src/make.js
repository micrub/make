'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CLI = require('./cli');
var Template = require('./template');
var parse = require('./parser');
var cp = require('template-copy');
var path = require('path');

var UNKNOWN_TARGET = 'target:unknown';

var Make = function (_CLI) {
  _inherits(Make, _CLI);

  _createClass(Make, [{
    key: 'example',


    // Used to generate the help output
    get: function get() {
      return 'make <target...> [options]';
    }
  }, {
    key: 'more',
    get: function get() {
      return new Template().more;
    }
  }, {
    key: 'flags',
    get: function get() {
      return {
        help: 'Show this help output',
        version: 'Show package version',
        debug: 'Enable extended log output'
      };
    }
  }, {
    key: 'alias',
    get: function get() {
      return {
        h: 'help',
        v: 'version',
        d: 'debug'
      };
    }
  }]);

  function Make(filename) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Make);

    var _this = _possibleConstructorReturn(this, (Make.__proto__ || Object.getPrototypeOf(Make)).call(this, opts));

    if (_this.argv.help && !filename) {
      _this.help();
      return _possibleConstructorReturn(_this);
    }

    _this.debug('Make init CLI with %s options', Object.keys(opts).join(' '));

    _this.makefile = filename;

    _this.target = _this.args.shift();

    if (_this.target === 'init') {
      _this.generate(_this.args.shift(), _this.args);
      return _possibleConstructorReturn(_this);
    }

    if (!filename) {
      Make.fail('Missing Makefile / Bakefile', filename);
      _this.info('Run "make init" to generate a Makefile.');
      return _possibleConstructorReturn(_this);
    }

    process.nextTick(_this.init.bind(_this));
    return _this;
  }

  _createClass(Make, [{
    key: 'init',
    value: function init() {
      var argv = this.argv;
      if (argv.help && !this.makefile) {
        return this.help();
      }

      if (argv.version) {
        console.log(require('../package.json').version);
        return this;
      }

      this.file = this.read(this.makefile);
      this.result = parse(this.file);

      this.targets = this.result.targets;
      this.variables = this.result.variables;

      var first = this.target || 'all';
      if (!this.targets[first]) {
        this.debug('No target %s', first);
        if (first === 'all') return this.help(this.targets);
        return this.noTarget(first);
      }

      if (argv.help) {
        return this.help(this.targets);
      }

      var args = this.argv._;
      if (first === 'all' && !args.length) args = ['all'];

      // Run!
      return this.run(first, args);
    }
  }, {
    key: 'run',
    value: function run(target, targets) {
      var _this3 = this;

      this.debug('Run %s targets', targets.join(' '));
      var argv = targets.concat();

      return new Promise(function (r, errback) {
        (function next(name) {
          var _this2 = this;

          if (!name) return this.end(r);

          this.executeTarget(name).then(function () {
            next.call(_this2, argv.shift());
          }).catch(function (err) {
            Make.fail(argv.debug ? err : err.message);
            errback(err);
          });
        }).call(_this3, argv.shift());
      });
    }
  }, {
    key: 'noTarget',
    value: function noTarget(target) {
      var _this4 = this;

      this.debug('Emit %s', UNKNOWN_TARGET);
      var handler = this.emit(UNKNOWN_TARGET, target, this.targets);
      this.debug('Handled', handler);

      return new Promise(function (r, errback) {
        if (handler) return errback();

        _this4.help(_this4.targets);
        return errback(new Error('No target matching "' + target + '"'));
      });
    }
  }, {
    key: 'executeTarget',
    value: function executeTarget(target) {
      var _this5 = this;

      return new Promise(function (r, errback) {
        if (!_this5.targets[target]) {
          return _this5.noTarget(target);
        }

        _this5.info('Invoking %s target', target);
        var name = _this5.targets[target];
        return _this5.executeRecipe(name, target).then(r).catch(errback);
      });
    }
  }, {
    key: 'executeRecipe',
    value: function executeRecipe(target, name) {
      var _this6 = this;

      return new Promise(function (r, errback) {
        var prerequities = target.prerequities;

        // deps on this recipe, execute rules right away
        if (!prerequities.length) return _this6.executeRules(target).then(r).catch(errback);

        // found prereq, execute them before executing rules
        _this6.debug('Prerequities "%s" for target %s', prerequities.join(' '), name);
        return _this6.executePrereq(target).then(function () {
          return _this6.executeRules(target).then(r).catch(errback);
        }).catch(errback);
      });
    }
  }, {
    key: 'executePrereq',
    value: function executePrereq(target) {
      var _this8 = this;

      return new Promise(function (r, errback) {
        var prerequities = target.prerequities;

        // Before executing this recipe, execute any prerequities first
        (function nextPrereq(pre) {
          var _this7 = this;

          if (!pre) return r();

          this.executeTarget(pre).catch(errback).then(function () {
            nextPrereq.call(_this7, prerequities.shift());
          });
        }).call(_this8, prerequities.shift());
      });
    }
  }, {
    key: 'executeRules',
    value: function executeRules(target) {
      return this.exec(target.recipe);
    }
  }, {
    key: 'generate',
    value: function generate() {
      var _this9 = this;

      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.argv._;

      this.debug('Argv', process.argv);
      var template = new Template({
        namespace: 'make:init',
        argv: process.argv.slice(3)
      });

      if (this.argv.help) return template.help();

      if (name.charAt(0) === '@') {
        // Lookup on github instead (todo: npm)

        var repo = name.slice(1).split('/').slice(0, 2).join('/');
        var repository = repo.split('/').slice(-1)[0];
        this.info('From github: %s', repo);
        var request = require('./fetch');
        return request.github(name.slice(1)).then(function (dir) {
          _this9.success('Done fetching %s content from github', name.slice(1));
          _this9.info('Directory %s', dir);

          var subtree = name.split('/').slice(2).join('/');
          var src = path.join(dir, repository + '-master', subtree || '');
          var dest = path.resolve() + '/';

          var cmd = src + ' ' + dest;
          _this9.debug('hcp', cmd);
          return cp(cmd, { debug: true }).catch(function (err) {
            return _this9.error(err);
          }).then(function () {
            return _this9.success('hcp ok');
          });
        });
      }

      return template.run(name, args).then(template.end.bind(template));
    }
  }]);

  return Make;
}(CLI);



Make.UNKNOWN_TARGET = UNKNOWN_TARGET;
export default Make;