'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cli = require('./cli');

var _cli2 = _interopRequireDefault(_cli);

var _stream = require('stream');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var exists = _fs2.default.existsSync;
var assign = Object.assign;

var Template = function (_CLI) {
  _inherits(Template, _CLI);

  _createClass(Template, [{
    key: 'example',
    get: function get() {
      return 'make init <template> [options]';
    }
  }, {
    key: 'home',
    get: function get() {
      return process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME;
    }
  }, {
    key: 'more',
    get: function get() {
      var _this2 = this;

      var lens = this.templates.map(function (template) {
        return template.name.length;
      });
      var max = Math.max.apply(null, lens.concat(_cli2.default.PADDING));

      var templates = this.templates.map(function (template) {
        var json = template.json;
        var config = json.make || {};
        var desc = config.description || json.description || 'Generate ' + template.name + ' setup';
        var deps = assign({}, json.dependencies, json.devDependencies);
        deps = Object.keys(deps).slice(0, 4).join(', ');
        deps = deps.length > _cli2.default.PADDING ? deps.slice(0, _cli2.default.PADDING) + '...' : deps;
        if (deps) deps = ' (' + deps + ')';

        var pad = _this2.pad(template.name, max);
        var leftpad = _this2.options.leftpad || '    ';
        return '' + leftpad + template.name + pad + desc + deps;
      }).join('\n');

      return '\n  Templates:\n' + templates + '\n';
    }

    // Used to parse arguments with minimist

  }, {
    key: 'alias',
    get: function get() {
      return {
        h: 'help',
        v: 'version',
        d: 'debug',
        f: 'force'
      };
    }

    // Used to generate the help output

  }, {
    key: 'flags',
    get: function get() {
      return {
        help: 'Show this help output',
        version: 'Show package version',
        debug: 'Enable extended log output',
        force: 'Force file write even if already existing',
        skip: 'Skip scripts hook'
      };
    }
  }, {
    key: 'directories',
    get: function get() {
      return [_path2.default.join(this.home, '.config/make/templates'), _path2.default.join(this.home, '.make/templates'), _path2.default.join(__dirname, '../templates')];
    }
  }]);

  function Template() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Template);

    var _this = _possibleConstructorReturn(this, (Template.__proto__ || Object.getPrototypeOf(Template)).call(this, options));

    _this.templates = _this.loadTemplates();
    _this.names = _this.templates.map(function (dir) {
      return dir.name;
    });
    return _this;
  }

  _createClass(Template, [{
    key: 'init',
    value: function init() {
      var _this3 = this;

      if (this.argv.help) return this.help();

      var args = this.parse();
      var name = args._.shift();

      return this.run(name, args._).then(function () {
        _this3.end();
      });
    }
  }, {
    key: 'expandTemplateDirectory',
    value: function expandTemplateDirectory(template) {
      var _this4 = this;

      var dir = template.dir;
      if (!exists(dir)) return template;

      var files = _fs2.default.readdirSync(dir).map(this.resolve(dir)).filter(this.file);

      var lengths = files.map(this.basename).map(function (file) {
        return file.length;
      });
      var max = this.max = Math.max.apply(null, lengths) + 2;
      var cwd = _path2.default.resolve();

      var promises = files.map(function (file) {
        var name = file.replace(dir + '/', '');
        var dest = _path2.default.resolve(_path2.default.basename(file));
        var destname = dest.replace(cwd, '.');

        return _this4.template(file, dest).then(function () {
          _this4.info('%s%s-> %s', name, _this4.pad(name, max), destname);
          _this4.debug('Finished streaming %s content', _path2.default.basename(file));
        });
      });

      return assign({}, template, { promises: promises });
    }

    // template(file, dest = path.resolve(file)) {

  }, {
    key: 'template',
    value: function template(file) {
      var dest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _path2.default.resolve(_path2.default.basename(file));

      if (_path2.default.basename(file) === 'package.json') return this.json(file, dest);
      if (_path2.default.basename(file) === '.eslintrc') return this.json(file, dest);
      if (_path2.default.basename(file) === '.babelrc') return this.json(file, dest);
      return this.stream(file, dest);
    }
  }, {
    key: 'json',
    value: function json(file, dest) {
      var _this5 = this;

      if (exists(dest)) return this.mergeJSON(file, dest).then(function () {
        _this5.debug('Finished merging %s file', _path2.default.basename(file));
      });

      return this.stream(file, dest);
    }
  }, {
    key: 'mergeJSON',
    value: function mergeJSON(file, dest) {
      var _this6 = this;

      var name = _path2.default.basename(file);
      this.warning('%s%salready exists, merging', name, this.pad(name, this.max));
      return new Promise(function (r, errback) {
        var data = _this6.readJSON(dest);
        var json = _this6.readJSON(file);

        var devs = json.devDependencies;
        var deps = json.dependencies;

        // make sure to ignore "make" field in JSON stringify
        var opts = { make: undefined };
        if (devs) opts.devDependencies = assign({}, devs, data.devDependencies);
        if (deps) opts.dependencies = assign({}, deps, data.dependencies);

        var result = assign({}, json, data, opts);
        _this6.debug('JSON:', result);
        _fs2.default.writeFile(dest, JSON.stringify(result, null, 2), function (err) {
          return err ? errback(err) : r();
        });
      });
    }
  }, {
    key: 'stream',
    value: function stream(file, dest) {
      var _this7 = this;

      return new Promise(function (r, errback) {
        var existing = exists(dest);
        var filename = _path2.default.basename(dest);
        var destname = dest.replace(_path2.default.resolve(), '.');
        var output = existing ? _this7.noopStream() : _fs2.default.createWriteStream(dest);
        var input = _fs2.default.createReadStream(file);

        if (existing) _this7.warning('%s%salready exists, skipping', filename, _this7.pad(filename, _this7.max));

        var stream = input.pipe(output).on('error', errback).on('close', r);
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this8 = this;

      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
      var args = arguments[1];

      var template = this.templates.find(function (template) {
        return template.name === name;
      });

      if (!template) {
        return _cli2.default.fail('No "%s" template', name);
      }

      this.info('Running %s template in %s', name, args.join(' '), process.cwd());
      this.config = template.json ? template.json.make || {} : {};
      this.scripts = this.config.scripts || {};

      return this.invoke('start').then(function () {
        var dir = _this8.expandTemplateDirectory(template);
        return Promise.all(dir.promises).then(_this8.invoke.bind(_this8, 'install')).catch(_cli2.default.fail);
      });
    }
  }, {
    key: 'invoke',
    value: function invoke(name) {
      var args = this.args;
      if (this.argv.skip) return this.noop('Skipping %s script (--skip)', name);

      this.debug('Invoke %s', name, this.argv);
      return this.script('pre' + name).then(this.script.bind(this, name)).then(this.script.bind(this, 'post' + name));
    }
  }, {
    key: 'noop',
    value: function noop() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length) this.info.apply(this, args);
      return new Promise(function (r, errback) {
        r();
      });
    }
  }, {
    key: 'script',
    value: function script(name) {
      var scripts = this.scripts || {};
      var script = scripts[name] || '';

      if (!script) return this.noop();

      this.info('%s script', name);
      return this.exec(script);
    }
  }, {
    key: 'loadTemplates',
    value: function loadTemplates() {
      var _this9 = this;

      var dirs = this.directories;
      this.debug('Load templates from %d directories', dirs.length);

      return dirs
      // Ignore invalid dirs
      .filter(this.exists)
      // Load template from these dirs
      .map(this.loadTemplatesFrom, this)
      // Flatten
      .reduce(function (a, b) {
        return a.concat(b);
      }, [])
      // Transfrom into a mapping { name: dir }
      .map(function (dir) {
        var json = _path2.default.join(dir, 'package.json');

        return {
          dir: dir,
          name: _this9.basename(dir),
          json: exists(json) ? require(json) : {}
        };
      });
    }
  }, {
    key: 'loadTemplatesFrom',
    value: function loadTemplatesFrom(dir) {
      this.debug('Load templates from', dir);
      return _fs2.default.readdirSync(dir).map(this.resolve(dir), this).filter(this.directory);
    }
  }, {
    key: 'has',
    value: function has(name) {
      var names = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.names;

      return names.indexOf(name) !== -1;
    }
  }, {
    key: 'noopStream',
    value: function noopStream() {
      var stream = new _stream.Stream();
      stream.write = function () {};
      stream.end = function () {
        stream.emit('finish');
        stream.emit('close');
      };
      return stream;
    }
  }]);

  return Template;
}(_cli2.default);

export default Template;