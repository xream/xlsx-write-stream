import fs from 'fs';
import { expect } from 'chai';
import unzipper from 'unzipper';
import XLSXWriteStream from '../src/XLSXWriteStream';
import { initialize, clean, tmpFolderPath } from './utils';

describe('XLSXWriteStream', function() {
  before(initialize);
  after(clean);

  const testRowArray = [1, '02', new Date('2015-10-21T16:29:00.000Z'), true, false, '=40+2', '🦄'];
  const testRowObject = {
    col1: 1,
    col2: '02',
    col3: new Date('2015-10-21T16:29:00.000Z'),
    col4: true,
    col5: false,
    col6: '=40+2',
    col7: '🦄'
  };

  it('Should stream a well formed empty xlsx without error', async function() {
    const tmpFilePath = `${tmpFolderPath}/empty-file.xlsx`;
    const modelFilePath = 'test/resources/empty-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream();
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should stream a well formed specs xlsx without error', async function() {
    const tmpFilePath = `${tmpFolderPath}/specs-file.xlsx`;
    const modelFilePath = 'test/resources/specs-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream();
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowArray);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should handle pushing object rows without error', async function() {
    const tmpFilePath = `${tmpFolderPath}/specs-file.xlsx`;
    const modelFilePath = 'test/resources/specs-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream();
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowObject);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should handle pushing object rows with headers set to true', async function() {
    const tmpFilePath = `${tmpFolderPath}/headers-file.xlsx`;
    const modelFilePath = 'test/resources/headers-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream({ headers: true });
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowObject);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should handle pushing object rows with headers set to a specific subset', async function() {
    const tmpFilePath = `${tmpFolderPath}/headers-subset-file.xlsx`;
    const modelFilePath = 'test/resources/headers-subset-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream({ headers: ['col1', 'col3', 'col7'] });
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowObject);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should handle pushing array rows with headers set', async function() {
    const tmpFilePath = `${tmpFolderPath}/headers-file.xlsx`;
    const modelFilePath = 'test/resources/headers-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream({ headers: Object.keys(testRowObject) });
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowArray);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });

  it('Should handle pushing array rows with headers set to a subset length', async function() {
    const tmpFilePath = `${tmpFolderPath}/headers-subset-from-start-file.xlsx`;
    const modelFilePath = 'test/resources/headers-subset-from-start-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream({ headers: Object.keys(testRowObject).slice(0, 3) });
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write(testRowArray);
    xlsxWriteStream.end();

    await new Promise(resolve => {
      fileWriteStream.on('close', resolve);
    });

    await expectEqualXlsxContent(tmpFilePath, modelFilePath);
  });
});

async function expectEqualXlsxContent(tmpFilePath, modelFilePath) {
  const readAll = async readable => {
    const chunks = [];
    let chunk;
    while ((chunk = readable.read()) != null) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };
  const retrieveEntries = async path => {
    const dictionary = {};
    await fs
      .createReadStream(path)
      .pipe(unzipper.Parse())
      .on('entry', async function(entry) {
        if (entry.type === 'File') {
          dictionary[entry.path] = entry;
        }
      })
      .promise();
    return dictionary;
  };
  const t1 = await retrieveEntries(tmpFilePath);
  const t2 = await retrieveEntries(modelFilePath);
  for (const [filename, entry] of Object.entries(t1)) {
    expect(t2[filename]).to.exist;
    const c1 = await readAll(entry);
    const c2 = await readAll(t2[filename]);
    expect(c1.toString()).to.be.equal(c2.toString());
  }
}
