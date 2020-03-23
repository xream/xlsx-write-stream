const baseString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function getCellId(rowIndex, cellIndex) {
  let cellXPosition = '';
  let position;
  let remaining = cellIndex;
  do {
    position = remaining % baseString.length;
    cellXPosition = baseString[position] + cellXPosition;
    remaining = Math.floor(remaining / baseString.length) - 1;
  } while (remaining >= 0);
  return `${cellXPosition}${rowIndex + 1}`;
}
