import defaultsDeep from 'lodash/defaultsDeep';
import Archiver from 'archiver';
import { Transform, PassThrough } from 'stream';
import * as templates from './templates';
import XLSXRowTransform from './XLSXRowTransform';

const isBoolean = value => value === !!value;

/**
 * XLSX Write Stream base class
 */
export default class XLSXWriteStream extends Transform {
  /**
   * Create new stream transform that handles Array or Object as input chunks.
   * Be aware that first row chunk is determinant in the transform configuration process for further row chunks.
   * @class XLSXWriteStream
   * @extends Transform
   * @param {Object} [options]
   * @param {Array|Boolean} [options.headers=false] - If set to an array they will be printed in first row, no matter what is streamed in input.
   *                                                  If receiving objects from input stream, only properties given in headers will be printed following headers order.
   *                                                  If set to true it only has effect when streaming objects in order to print inferred headers in first place.
   * @param {Boolean} [options.format=true] - If set to false writer will not format cells with number, date, boolean and text.
   * @param {Object} [options.styleDefs] - If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`.
   * @param {Boolean} [options.immediateInitialization=false] - If set to true writer will initialize archive and start compressing xlsx common stuff immediately, adding subsequently a little memory and processor footprint. If not, initialization will be delayed to the first data processing.
   */
  constructor(options) {
    super({ objectMode: true });

    this.pipelineInitialized = false;
    this.initialized = false;
    this.arrayMode = null;

    this.options = defaultsDeep({}, options, { headers: false, format: true, immediateInitialization: false });

    if (this.options.immediateInitialization) this._initializePipeline();
  }

  _transform(chunk, encoding, callback) {
    if (!this.initialized) this._initialize(chunk);

    this.toXlsxRow.write(this.normalize(chunk), encoding, callback);
  }

  _initialize(chunk) {
    this._initializePipeline();
    this._initializeHeaders(chunk);

    if (chunk) {
      this.arrayMode = Array.isArray(chunk);
      this.normalize = this.arrayMode
        ? chunk => this.options.headers.map((value, index) => chunk[index])
        : chunk => this.options.headers.map(key => chunk[key]);
    }

    this.initialized = true;
  }

  /**
   * Initialize pipeline with xlsx archive common files
   */
  _initializePipeline() {
    if (this.pipelineInitialized) return;

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

    this.toXlsxRow = new XLSXRowTransform({ format: this.options.format, styles });
    this.sheetStream = new PassThrough();
    this.sheetStream.write(templates.SheetHeader);
    this.toXlsxRow.pipe(this.sheetStream);
    this.zip.append(this.sheetStream, {
      name: 'xl/worksheets/sheet1.xml'
    });

    this.pipelineInitialized = true;
  }

  _initializeHeaders(chunk = []) {
    const shouldPrintHeaders = !!this.options.headers;

    if (Array.isArray(chunk)) {
      if (isBoolean(this.options.headers)) {
        // Cannot infer headers from an Array
        // => Ignore `headers` option silently.
        this.options.headers = chunk.map(() => undefined);
        return;
      }
    } else {
      if (isBoolean(this.options.headers)) {
        // Init headers from chunk
        this.options.headers = [...Object.keys(chunk)];
      }
    }

    if (shouldPrintHeaders) {
      this.toXlsxRow.write(this.options.headers);
    }
  }

  _flush(callback) {
    if (!this.initialized) this._initialize();
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
