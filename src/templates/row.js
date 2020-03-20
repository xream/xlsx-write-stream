import cell from './cell';
import { getCellId } from '../utils';

export default function row(index, values, format, styles) {
  return `    <row r="${index + 1}" spans="1:${values.length}" x14ac:dyDescent="0.2">
      ${values.map((cellValue, cellIndex) => cell(cellValue, getCellId(index, cellIndex), format, styles)).join('\n      ')}
    </row>
`;
}
