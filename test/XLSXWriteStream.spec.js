import fs from 'fs';
import { expect } from 'chai';
import unzipper from 'unzipper';
import XLSXWriteStream from '../src/XLSXWriteStream';
import { initialize, clean, tmpFolderPath } from './utils';

describe('XLSXWriteStream', function() {
  before(initialize);
  after(clean);

  it('Should stream a well formed empty xlsx without error', async function() {
    const tmpFilePath = `${tmpFolderPath}/empty-file.xlsx`;
    const modelFilePath = 'test/resources/empty-file.xlsx';

    const xlsxWriteStream = new XLSXWriteStream({ format: true });
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

    const xlsxWriteStream = new XLSXWriteStream({ format: true });
    const fileWriteStream = fs.createWriteStream(tmpFilePath);

    xlsxWriteStream.pipe(fileWriteStream);
    xlsxWriteStream.write([1, '02', new Date('2015-10-21T16:29:00.000Z'), true, false, '=40+2']);
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
    for await (let chunk of readable) {
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
