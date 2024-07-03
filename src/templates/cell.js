import { TypeStyleKey, getBestNumberTypeStyleKey } from './styles';
import xmlEscape from 'xml-escape';

const isDate = (d) => d instanceof Date && !isNaN(d);
const isNumber = (n) => typeof n === 'number';
const isString = (s) => typeof s === 'string';
const isBoolean = (b) => b === !!b;
const isFormulaString = (s) => s.startsWith('=');

export default function (value, cell, format, styles, cellIndex) {
  // const col = cell.match(/^([A-Z]+)(\d+)$/)[1];
  const colStyle = styles.typeStyleDefinitions[`${cellIndex}`];
  const colType = colStyle ? colStyle.type : undefined;
  const colStyleId = colStyle ? colStyle.index : undefined;

  if (colType === 'Date' || isDate(value)) {
    return `<c r="${cell}" t="d" ${
      format ? `s="${colStyleId != null ? colStyleId : styles.getStyleId(TypeStyleKey.DATE)}"` : ''
    }><v>${value.toISOString()}</v></c>`;
  } else if (/String$/.test(colType) || isString(value)) {
    if (colType === 'FormulaString' || isFormulaString(value)) {
      return `<c r="${cell}" t="str"><f>${xmlEscape(value).substr(1)}</f></c>`;
    }
    return `<c r="${cell}" t="inlineStr" ${
      format ? `s="${colStyleId != null ? colStyleId : styles.getStyleId(TypeStyleKey.TEXT)}"` : ''
    }><is><t>${xmlEscape(value)}</t></is></c>`;
  } else if (colType === 'Boolean' || isBoolean(value)) {
    return `<c r="${cell}" t="b"><v>${value ? 1 : 0}</v></c>`;
  } else if (colType === 'Number' || isNumber(value)) {
    return `<c r="${cell}" t="n" ${
      format ? `s="${colStyleId != null ? colStyleId : styles.getStyleId(getBestNumberTypeStyleKey(value))}"` : ''
    }><v>${value}</v></c>`;
  } else if (value) {
    return `<c r="${cell}" t="inlineStr"><is><t>${xmlEscape(`${value}`)}</t></is></c>`;
  }
  return '';
}
