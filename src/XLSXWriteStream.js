import Archiver from 'archiver';
import { Transform, PassThrough } from 'stream';
import * as templates from './templates';
import XLSXRowTransform from './XLSXRowTransform';

/**
 * XLSX Write Stream base class
 */
export default class XLSXWriteStream extends Transform {
  /**
   * Create new Stream
   * @class XLSXWriteStream
   * @extends Transform
   * @param {Object} [options]
   * @param {Boolean} [options.format=true] - If set to false writer will not format cells with number, date, boolean and text.
   * @param {Object} [options.styleDefs] - If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`.
   * @param {Boolean} [options.immediateInitialization=false] - If set to true writer will initialize archive and start compressing xlsx common stuff immediately, adding subsequently a little memory and processor footprint. If not, initialization will be delayed to the first data processing.
   */
  constructor(options) {
    super({ objectMode: true });

    this.initialized = false;

    this.options = Object.assign({ format: true, immediateInitialization: false }, options);

    if (this.options.immediateInitialization) this._initializePipeline();
  }

  /**
   * Initialize pipeline with xlsx archive common files
   */
  _initializePipeline() {
    this.zip = Archiver('zip', { forceUTC: true });
    this.zip.catchEarlyExitAttached = true;

    // Common xlsx archive files (not editable)
    this.zip.append(templates.ContentTypes, { name: '[Content_Types].xml' });
    this.zip.append(templates.Rels, { name: '_rels/.rels' });
    this.zip.append(templates.Workbook, { name: 'xl/workbook.xml' });
    this.zip.append(templates.WorkbookRels, { name: 'xl/_rels/workbook.xml.rels' });

    // Style xlsx definitions (one time generation)
    const styles = new templates.Styles(this.options.styleDefs);
    this.zip.append(styles.render(), { name: 'xl/styles.xml' });

    this.zip
      .on('data', data => this.push(data))
      .on('warning', err => this.emit('warning', err))
      .on('error', err => this.error('error', err));

    this.toXlsxRow = new XLSXRowTransform({ ...this.options, styles });
    this.sheetStream = new PassThrough();
    this.sheetStream.write(templates.SheetHeader);
    this.toXlsxRow.pipe(this.sheetStream);
    this.zip.append(this.sheetStream, {
      name: 'xl/worksheets/sheet1.xml'
    });

    this.initialized = true;
  }

  _transform(chunk, encoding, callback) {
    if (!this.initialized) this._initializePipeline();
    this.toXlsxRow.write(chunk, encoding, callback);
  }

  _flush(callback) {
    if (!this.initialized) this._initializePipeline();
    this._finalize().then(() => {
      callback();
    });
  }

  /**
   * Finalize the zip archive
   */
  _finalize() {
    this.sheetStream.end(templates.SheetFooter);
    return this.zip.finalize();
  }
}
