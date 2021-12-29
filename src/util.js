'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonlint = require('jsonlint');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _exists = _fs2.default.existsSync;

var debug = require('debug')('make:util');

// FS util mixin
var util = {
  basename: function basename(filepath) {
    return _path2.default.basename(filepath);
  },
  resolve: function resolve(dir) {
    return function (filepath) {
      return _path2.default.join(dir, filepath);
    };
  },
  file: function file(filepath) {
    debug('Check is file', filepath);
    return _fs2.default.statSync(filepath).isFile();
  },
  directory: function directory(filepath) {
    debug('Check is directory', filepath);
    return _fs2.default.statSync(filepath).isDirectory();
  },
  exists: function exists(filepath) {
    debug('Check %s filepath exists', filepath);
    return _exists(filepath);
  },
  read: function read(filepath) {
    var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';

    return _fs2.default.readFileSync(filepath, encoding);
  },
  readdir: function readdir(filepath) {
    return _fs2.default.readdirSync(filepath);
  },
  readJSON: function readJSON(file) {
    var ext = _path2.default.extname(file);
    if (ext === '.json') return require(file);

    var content = this.read(file);

    try {
      return (0, _jsonlint.parse)(content);
    } catch (e) {
      this.error('JSON Parsing error for %s', file);
      this.error(e.message);
      this.error(content);
      return {};
    }
  }
};

export default util