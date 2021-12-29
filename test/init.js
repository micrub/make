
const cli = require('gentle-cli');
const { join } = require('path');
const { readdirSync: dir } = require('fs');
const assert = require('assert');

describe('bake init', () => {
  const bake = (cmd) => {
    return cli({ cwd: join(__dirname, 'examples') })
      .use('node ' + join(__dirname, '../bin/make.js') + ' ' + cmd);
  };

  it('bake init', (done) => {
    bake('init')
      .expect(2, () => {
        const files = dir(join(__dirname, 'examples'));
        assert.equal(files.length, 1);

        done();
      });
  });
});
