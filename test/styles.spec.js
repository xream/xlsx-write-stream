import fs from 'fs';
import { expect } from 'chai';
import { initialize, clean, tmpFolderPath } from './utils';
import { Styles } from '../src/templates';
import { getBestNumberTypeStyleKey, TypeStyleKey } from '../src/templates/styles';

describe('Styles', function() {
  before(initialize);
  after(clean);

  describe('Formats function', function() {
    const styles = new Styles();

    it('should return `TypeStyleKey.EXP_NUMBER` for integer length 11+', function() {
      const expected = TypeStyleKey.EXP_NUMBER;
      expect(getBestNumberTypeStyleKey(10000000000)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(1000000000000)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-10000000000)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-1000000000000)).to.be.equal(expected);
      expect(styles.getStyleId(TypeStyleKey.EXP_NUMBER)).to.be.equal(5);
    });

    it('should return `TypeStyleKey.INT` for integer from 0 to 999', function() {
      const expected = TypeStyleKey.INT;
      expect(getBestNumberTypeStyleKey(0)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-10)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(999)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-1)).to.be.equal(expected);
    });

    it('should return `TypeStyleKey.FLOAT` for float from 0 to 999', function() {
      const expected = TypeStyleKey.FLOAT;
      expect(getBestNumberTypeStyleKey(1.22)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-10.1231)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(999.1)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-1.2222222)).to.be.equal(expected);
    });

    it('should return `TypeStyleKey.BIG_INT` for integer from 1000', function() {
      const expected = TypeStyleKey.BIG_INT;
      expect(getBestNumberTypeStyleKey(1000)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(1000000000)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-2500)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-38000)).to.be.equal(expected);
    });

    it('should return `TypeStyleKey.BIG_FLOAT` for floats from 1000', function() {
      const expected = TypeStyleKey.BIG_FLOAT;
      expect(getBestNumberTypeStyleKey(1000.12)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(10000000.1)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-2500.4232)).to.be.equal(expected);
      expect(getBestNumberTypeStyleKey(-3800.10012)).to.be.equal(expected);
    });
  });

  describe('Style id function (defaults)', function() {
    const styles = new Styles();

    it('should return 1 for integer from 0 to 999', function() {
      const expected = 1;
      expect(styles.getStyleId(TypeStyleKey.INT)).to.be.equal(expected);
    });

    it('should return 2 for float from 0 to 999', function() {
      const expected = 2;
      expect(styles.getStyleId(TypeStyleKey.FLOAT)).to.be.equal(expected);
    });

    it('should return 3 for integer from 1000', function() {
      const expected = 3;
      expect(styles.getStyleId(TypeStyleKey.BIG_INT)).to.be.equal(expected);
    });

    it('should return 4 for floats from 1000', function() {
      const expected = 4;
      expect(styles.getStyleId(TypeStyleKey.BIG_FLOAT)).to.be.equal(expected);
    });

    it('should return 5 for integer length 11+', function() {
      const expected = 5;
      expect(styles.getStyleId(TypeStyleKey.EXP_NUMBER)).to.be.equal(expected);
    });

    it('should return 6 for text', function() {
      const expected = 6;
      expect(styles.getStyleId(TypeStyleKey.TEXT)).to.be.equal(expected);
    });

    it('should return 7 for all dates', function() {
      const expected = 7;
      expect(styles.getStyleId(TypeStyleKey.DATE)).to.be.equal(expected);
    });
  });

  describe('Render', function() {
    it('Should render right style ids', async function() {
      const tmpFilePath = `${tmpFolderPath}/styles.xml`;
      const modelFilePath = 'test/resources/styles.xml';

      const fileWriteStream = fs.createWriteStream(tmpFilePath);

      const styles = new Styles();
      fileWriteStream.end(styles.render());

      await new Promise(resolve => {
        fileWriteStream.on('close', resolve);
      });

      const f1 = fs.readFileSync(tmpFilePath);
      const f2 = fs.readFileSync(modelFilePath);
      expect(f1.toString()).to.be.equal(f2.toString());
    });
  });
});
