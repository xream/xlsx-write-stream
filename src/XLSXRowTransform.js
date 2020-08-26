import { Transform } from 'stream';
import { Row, Styles } from './templates';

/**
 * Class representing a XLSX Row transformation from array to Row.
 */
export default class XLSXRowTransform extends Transform {
  /**
   * Create new xlsx row transform stream
   * @param {Object} [options]
   * @param {Boolean} [options.header=false] - If set to true writer will output first row with an header style.
   * @param {Boolean} [options.format=true] - If set to false writer will not format cells with number, date, boolean and text.
   * @param {Styles} [options.styles=new Styles()] - If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`.
   */
  constructor({ header = false, format = true, styles = new Styles() }) {
    super({ objectMode: true });

    this.rowCount = 0;
    this.header = header;
    this.format = format;
    this.styles = styles;

    if (this.header) throw new Error('Header special style output not yet implemented.');
  }

  /**
   * Transform array to row string
   */
  _transform(row, encoding, callback) {
    const xlsxRow = Row(this.rowCount, row, this.format, this.styles);
    this.rowCount++;
    callback(null, xlsxRow);
  }
}
