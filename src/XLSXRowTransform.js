import { Transform } from 'stream';
import { Row, Styles } from './templates';

/**
 * Class representing a XLSX Row transformation from array to Row.
 */
export default class XLSXRowTransform extends Transform {
  /**
   * Create new xlsx row transform stream
   * @param {Object} [options]
   * @param {Boolean} [options.format=true] - If set to false writer will not format cells with number, date, boolean and text. Default: true.
   * @param {Styles} [options.styles=new Styles()] - If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`.
   */
  constructor({ format = true, styles = new Styles() }) {
    super({ objectMode: true });
    this.rowCount = 0;
    this.format = format;
    this.styles = styles;
  }

  /**
   * Transform array to row string
   */
  _transform(row, encoding, callback) {
    if (!Array.isArray(row)) return callback(); // TODO: Handle row as Object with column headers as keys

    const xlsxRow = Row(this.rowCount, row, this.format, this.styles);
    this.rowCount++;
    callback(null, xlsxRow);
  }
}
