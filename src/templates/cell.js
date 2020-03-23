import { TypeStyleKey, getBestNumberTypeStyleKey } from './styles';
import xmlEscape from 'xml-escape';

const isDate = d => d instanceof Date && !isNaN(d);
const isNumber = n => typeof n === 'number';
const isString = s => typeof s === 'string';
const isBoolean = b => b === !!b;
const isFormulaString = s => s.startsWith('=');

export default function(value, cell, format, styles) {
  if (isDate(value)) {
    return `<c r="${cell}" t="d" ${format ? `s="${styles.getStyleId(TypeStyleKey.DATE)}"` : ''}><v>${value.toISOString()}</v></c>`;
  } else if (isString(value)) {
    if (isFormulaString(value)) {
      return `<c r="${cell}" t="str"><f>${xmlEscape(value).substr(1)}</f></c>`;
    }
    return `<c r="${cell}" t="inlineStr" ${format ? `s="${styles.getStyleId(TypeStyleKey.TEXT)}"` : ''}><is><t>${xmlEscape(value)}</t></is></c>`;
  } else if (isBoolean(value)) {
    return `<c r="${cell}" t="b"><v>${value ? 1 : 0}</v></c>`;
  } else if (isNumber(value)) {
    return `<c r="${cell}" t="n" ${format ? `s="${styles.getStyleId(getBestNumberTypeStyleKey(value))}"` : ''}><v>${value}</v></c>`;
  } else if (value) {
    return `<c r="${cell}" t="inlineStr"><is><t>${xmlEscape(`${value}`)}</t></is></c>`;
  }
  return '';
}
