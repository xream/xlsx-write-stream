# ⏩ XLSX Write Stream ⏩

[![Build Status](https://travis-ci.org/atomictech/xlsx-write-stream.svg)](https://travis-ci.org/atomictech/xlsx-write-stream)
[![Version](https://img.shields.io/npm/v/@atomictech/xlsx-write-stream.svg)](https://www.npmjs.com/package/@atomictech/xlsx-write-stream)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/atomictech/xlsx-write-stream#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/atomictech/xlsx-write-stream/graphs/commit-activity)
[![License: Apache-2.0](https://img.shields.io/github/license/atomictech/xlsx-write-stream)](https://github.com/atomictech/xlsx-write-stream/blob/master/LICENSE)

> Stream huge amount of data into an XLSX generated file stream with minimum memory footprint.

XLSX Write Stream is a streaming writer for XLSX spreadsheets. Its purpose is to replace CSV for large exports, because using CSV in Excel is very buggy and error prone. It's very efficient and can quickly write hundreds of thousands of rows with low memory usage.

## Table of content

- [⏩ XLSX Write Stream ⏩](#%e2%8f%a9-xlsx-write-stream-%e2%8f%a9)
  - [Table of content](#table-of-content)
  - [📦 Install](#%f0%9f%93%a6-install)
  - [🦄 Usage](#%f0%9f%a6%84-usage)
    - [Basic](#basic)
    - [Custom Styles](#custom-styles)
  - [🔧 API](#%f0%9f%94%a7-api)
    - [XLSXWriteStream ⇐ `Transform`](#xlsxwritestream-%e2%87%90-transform)
    - [new XLSXWriteStream([options])](#new-xlsxwritestreamoptions)
    - [StyleDefs](#styledefs)
  - [🚧 Compatibility](#%f0%9f%9a%a7-compatibility)
  - [👥 Authors](#%f0%9f%91%a5-authors)
  - [🤝 Contributing](#%f0%9f%a4%9d-contributing)
  - [⭐️ Show your support](#%e2%ad%90%ef%b8%8f-show-your-support)
  - [📝 License](#%f0%9f%93%9d-license)

## 📦 Install

```sh
npm install '@atomictech/xlsx-write-stream'
```

## 🦄 Usage

### Basic

```js
import XLSXWriteStream from 'xlsx-write-stream';

// Initialize the writer
const xlsxWriter = new XLSXWriteStream();

// Pipe a Stream.Readable input stream into the writer
const inputStream = new MyCustomReadableStream();
inputStream.pipe(xlsxWriter);

// xlsxWriter should be feed with chunks representing a row as an array of values.
// Cell values type supported are: string, number, boolean and date.

// Alternatively you can use the writer `write(chunk)` method in order to fill your xlsx.
const row = [1, '02', new Date('2015-10-21T16:29:00.000Z'), true, false];
xlsxWriter.write(row);

// Pipe the writer into a Stream.Writable output stream in order to retrieve XLSX file data,
// write it into file or send it as HTTP response.
const writeStream = fs.createWriteStream('file.xlsx');
xlsxWriter.pipe(writeStream);
```

### Custom Styles

An `options.styleDefs` parameter is available in order to redefine type style formats.

```js
import { TypeStyleKey } from 'xlsx-write-stream';

// Declare custom styles definitions
const styleDefs = {};
styleDefs[TypeStyleKey.DATE] = { formatCode: 'yy-mm-dd hh:mm' };
styleDefs[TypeStyleKey.INT] = { numFmtId: 49 }; // 49 is "enforced text format"

// Create the writer
const xlsxWriter = new XLSXWriterStream({ styleDefs });

// NB: if you set `format: false` your styleDefs will not be used
```

## 🔧 API

### XLSXWriteStream ⇐ `Transform`

### new XLSXWriteStream([options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` |  |  |
| [options.format] | `Boolean` | `true` | If set to false writer will not format cells with number, date, boolean and text. |
| [options.styleDefs] | [`StyleDefs`](###styledefs) |  | If set you can overwrite default standard type styles by other standard ones or even define custom `formatCode`. |
| [options.immediateInitialization] | `Boolean` | `false` | If set to true writer will initialize archive and start compressing xlsx common stuff immediately, adding subsequently a little memory and processor footprint. If not, initialization will be delayed to the first data processing. |

### StyleDefs

A little of TypeScript to explain StyleDefs interface:

```ts
enum TypeStyleKey = {
  NUMBER: 'default', //!\\ Unused in the actual type conversion
  INT: 'int', // Integer <1000
  FLOAT: 'float', // Float <1000
  BIG_INT: 'bigInt', // Integer >=1000
  BIG_FLOAT: 'bigFloat', // Float >=1000
  EXP_NUMBER: 'expNumber', // Number with more than 10 digits/characters (ex: 10000000000 or 12.45678901)
  TEXT: 'text', // String
  DATE: 'date', // Date
  DATETIME: 'datetime' //!\\ Unused in the actual type conversion
};

interface TypeFormatReference {
  numFmtId: number;
}

interface TypeFormatDefinition {
  formatCode: string;
}

interface StyleDefs {
    [typeKey: TypeStyleKey]: TypeFormatReference | TypeFormatDefinition;
}
```

Example:

```js
{
  date: { formatCode: 'yy-mm-dd hh:mm' },
  int: { numFmt: 49 }
}
```

> See here for other default numFmtId:
> <https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.numberingformat?view=openxml-2.8.1>

## 🚧 Compatibility

XLSX Write Stream - supported:

Cell type:

- string [starting with `=`] ➡ formula
- string [others] ➡ text
- date ➡ date
- number ➡ number
- boolean ➡ boolean

Cell type formatting:

- text (default: `numFmtId: 49` - enforce text even if could be interpreted as number)
- date (default: `formatCode: 'yyyy-mm-dd'` - )
- number
  - int (default: `numFmtId: 1`)
  - float (default: `numFmtId: 2`)
  - bigInt (default: `numFmtId: 3`)
  - bigFloat (default: `numFmtId: 4`)
  - expNumber (default: `numFmtId: 1`)

XLSX Write Stream - **NOT** supported:

- charts
- comments
- ... and a myriad of other OOXML features. It's strictly an CSV replacement.

## 👥 Authors

👤 **Apify**

* Website: https://apify.com/
* Github: [@apifytech](https://github.com/apifytech)

👤 **AtomicTech**

* Github: [@atomictech](https://github.com/atomictech)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/atomictech/xlsx-write-stream/issues). You can also take a look at the [contributing guide](https://github.com/atomictech/xlsx-write-stream/blob/master/CONTRIBUTING.md).

## ⭐️ Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is [Apache-2.0](https://github.com/atomictech/xlsx-write-stream/blob/master/LICENSE) licensed.
