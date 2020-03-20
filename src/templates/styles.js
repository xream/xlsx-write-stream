const generateNumFmt = styleDefinition => `    <numFmt numFmtId="${styleDefinition.numFmtId}" formatCode="${styleDefinition.formatCode}" />`;
const generateNumFmts = styleDefinitions => {
  const customFormats = Object.entries(styleDefinitions).reduce((result, [key, value]) => {
    if (value.formatCode) result[key] = value;
    return result;
  }, {});
  return `  <numFmts count="${Object.keys(customFormats).length}">\n${Object.values(customFormats)
    .map(generateNumFmt)
    .join('\n')}\n  </numFmts>`;
};

const generateXf = styleDefinition => `    <xf numFmtId="${styleDefinition.numFmtId}" fontId="0" fillId="0" borderId="0" xfId="0"/>`;
const generateCellXfs = styleDefinitions =>
  `  <cellXfs count="${Object.keys(styleDefinitions).length}">\n${Object.values(styleDefinitions)
    .map(generateXf)
    .join('\n')}\n  </cellXfs>`;

export const TypeStyleKey = {
  NUMBER: 'default',
  INT: 'int',
  FLOAT: 'float',
  BIG_INT: 'bigInt',
  BIG_FLOAT: 'bigFloat',
  EXP_NUMBER: 'expNumber',
  TEXT: 'text',
  DATE: 'date',
  DATETIME: 'datetime'
};

export const getBestNumberTypeStyleKey = number => {
  const positiveNumber = Math.abs(number);
  if (positiveNumber.toString().length >= 11) {
    return TypeStyleKey.EXP_NUMBER;
  }
  if (positiveNumber % 1 === 0) {
    return positiveNumber >= 1000 ? TypeStyleKey.BIG_INT : TypeStyleKey.INT;
  }
  return positiveNumber >= 1000 ? TypeStyleKey.BIG_FLOAT : TypeStyleKey.FLOAT;
};

export const defaultStyleDefinitions = {
  default: { numFmtId: 0 },
  int: { numFmtId: 1 },
  float: { numFmtId: 2 },
  bigInt: { numFmtId: 3 },
  bigFloat: { numFmtId: 4 },
  expNumber: { numFmtId: 11 },
  text: { numFmtId: 49 },
  date: { formatCode: 'yyyy-mm-dd' },
  datetime: { formatCode: 'yyyy-mm-dd hh:mm:ss' }
};

const minNumFmtId = 200;
const patchDefinitions = styleDefinitions => {
  let styleIndex = 0;
  let nextNumFmtId = minNumFmtId;

  for (const [, styleDefinition] of Object.entries(styleDefinitions)) {
    styleDefinition.index = styleIndex++;

    if (!styleDefinition.numFmtId) {
      if (!styleDefinition.formatCode) continue;

      styleDefinition.numFmtId = nextNumFmtId++;
    }
  }
};

export default class Styles {
  constructor(styleDefinitions = {}) {
    this.typeStyleDefinitions = Object.assign({}, defaultStyleDefinitions, styleDefinitions);
    patchDefinitions(this.typeStyleDefinitions);
  }

  getStyleId(typeStyle) {
    return this.typeStyleDefinitions[typeStyle].index;
  }

  render() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac"
  xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
${generateNumFmts(this.typeStyleDefinitions)}
  <fonts count="1" x14ac:knownFonts="1">
    <font>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
      <scheme val="minor"/>
    </font>
  </fonts>
  <fills count="2">
    <fill>
      <patternFill patternType="none"/>
    </fill>
    <fill>
      <patternFill patternType="gray125"/>
    </fill>
  </fills>
  <borders count="1">
    <border>
      <left/>
      <right/>
      <top/>
      <bottom/>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
${generateCellXfs(this.typeStyleDefinitions)}
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
  <extLst>
    <ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}"
      xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main">
      <x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1"/>
    </ext>
  </extLst>
</styleSheet>`;
  }
}
