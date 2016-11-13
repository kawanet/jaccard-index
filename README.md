# jaccard-index

Promise-based Jaccard similarity coefficient index matrix calculation

[![npm version](https://badge.fury.io/js/jaccard-index.svg)](http://badge.fury.io/js/jaccard-index) [![Build Status](https://travis-ci.org/kawanet/jaccard-index.svg?branch=master)](https://travis-ci.org/kawanet/jaccard-index)

### Synopsis

```js
var Jaccard = require("jaccard-index");

var logs = {
  foo: ["user1", "user2"],
  bar: ["user2", "user3", "user4"],
  buz: ["user1", "user2", "user5"]
};

var source = Object.keys(logs); // foo, bar, buz

var options = {
  direction: false,
  expire: 1000,
  getList: getList
};

Jaccard(options).getMatrix(source).then(showResult).catch(console.warn);

function getList(id) {
  return Promise.resolve(logs[id]); // async
  // return logs[id]; // sync
}

function showResult(matrix) {
  console.log(JSON.stringify(matrix, null, 1));
}
```

Result matrix:

```json
{
  "foo": {"bar": 0.25, "buz": 0.667},
  "bar": {"foo": 0.25, "buz": 0.2},
  "buz": {"foo": 0.667, "bar": 0.2}
}
```

## SEE ALSO

### NPM

- [https://www.npmjs.com/package/jaccard-index](https://www.npmjs.com/package/jaccard-index)

### GitHub

- [https://github.com/kawanet/jaccard-index](https://github.com/kawanet/jaccard-index)

### Tests

- [https://travis-ci.org/kawanet/jaccard-index](https://travis-ci.org/kawanet/jaccard-index)

### The MIT License (MIT)

Copyright (c) 2016 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
