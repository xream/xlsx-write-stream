import defaultsDeep from 'lodash/defaultsDeep';
import isObject from 'lodash/isObject';
import Archiver from 'archiver';
import { Transform, PassThrough } from 'stream';
import * as templates from './templates';
import XLSXRowTransform from './XLSXRowTransform';

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
   * @param {Boolean} [options.header=false] - Display the column names on the first line if the columns option is provided or discovered.
   * @param {Array|Object} [options.columns] - List of properties when records are provided as objects.
   *                                           Work with records in the form of arrays based on index position; order matters.
   *                                           Auto discovered in the first record when the user write objects, can refer to nested properties of the input JSON, see the `header` option on how to print columns names on the first line.
   * @param {Boolean} [options.format=true] - If set to false writer will not format cells with number, date, boolean and text.
   * @param {Object} [options.styleDefs] - If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`.
   * @param {Boolean} [options.immediateInitialization=false] - If set to true writer will initialize archive and start compressing xlsx common stuff immediately, adding subsequently a little memory and processor footprint. If not, initialization will be delayed to the first data processing.
   */
  constructor(options) {
    super({ objectMode: true });

    this.pipelineInitialized = false;
    this.initialized = false;
    this.arrayMode = null;

    this.options = defaultsDeep({}, options, { header: false, format: true, immediateInitialization: false });

    if (this.options.immediateInitialization) this._initializePipeline();
  }

  _transform(chunk, encoding, callback) {
    if (!this.initialized) this._initialize(chunk);

    this.toXlsxRow.write(this.normalize(chunk), encoding, callback);
  }

  _initialize(chunk) {
    this._initializePipeline();
    this._initializeHeader(chunk);

    if (chunk) {
      this.arrayMode = Array.isArray(chunk);
      this.normalize = chunk => this.columns.map(key => chunk[key]);
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
      .on('error', err => this.emit('error', err));

    this.toXlsxRow = new XLSXRowTransform({ format: this.options.format, styles });
    this.sheetStream = new PassThrough();
    this.sheetStream.write(templates.SheetHeader);
    this.toXlsxRow.pipe(this.sheetStream, { end: false });
    this.zip.append(this.sheetStream, {
      name: 'xl/worksheets/sheet1.xml'
    });

    this.pipelineInitialized = true;
  }

  _initializeHeader(chunk = []) {
    if (Array.isArray(chunk)) {
      this.columns = (this.options.columns ? this.options.columns : chunk).map((value, index) => index);

      if (Array.isArray(this.options.columns)) {
        this.header = [...this.options.columns];
      } else if (isObject(this.options.columns)) {
        this.header = [...Object.values(this.options.columns)];
      }
    } else {
      if (Array.isArray(this.options.columns)) {
        this.header = [...this.options.columns];
        this.columns = [...this.options.columns];
      } else if (isObject(this.options.columns)) {
        this.header = [...Object.values(this.options.columns)];
        this.columns = [...Object.keys(this.options.columns)];
      } else {
        // Init header and columns from chunk
        this.header = [...Object.keys(chunk)];
        this.columns = [...Object.keys(chunk)];
      }
    }

    if (this.options.header && this.header) {
      this.toXlsxRow.write(this.header);
    }
  }

  _final(callback) {
    if (!this.initialized) this._initialize();
    this.toXlsxRow.end();
    this.toXlsxRow.on('end', () =>
      this._finalize().then(() => {
        callback();
      })
    );
  }

  /**
   * Finalize the zip archive
   */
  _finalize() {
    this.sheetStream.end(templates.SheetFooter);
    return this.zip.finalize();
  }
}
