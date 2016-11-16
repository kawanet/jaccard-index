# jaccard-index

Promise-based Jaccard similarity coefficient index calculation framework

[![npm version](https://badge.fury.io/js/jaccard-index.svg)](http://badge.fury.io/js/jaccard-index) [![Build Status](https://travis-ci.org/kawanet/jaccard-index.svg?branch=master)](https://travis-ci.org/kawanet/jaccard-index)

## FEATURES

- Fast [Jaccard index](https://en.wikipedia.org/wiki/Jaccard_index) calculation framework for [collaborative filtering](https://en.wikipedia.org/wiki/Collaborative_filtering)
- Promise-based asynchronous data source loading
- Built-in on-memory cache mechanism with automatic expiration
- Concurrency throttle for huge data sets
- Both directional and no-directional graph links

## SYNOPSIS

```js
var Jaccard = require("jaccard-index");

var logs = {
  "item1": ["user1", "user2"],
  "item2": ["user2", "user3", "user4"],
  "item3": ["user1", "user2", "user5"]
};

var items = Object.keys(logs); // item1, item2, item3

var options = {
  getLog: getLog
};

Jaccard(options).getLinks(items).then(showResult).catch(console.warn);

function getLog(item) {
  return Promise.resolve(logs[item]); // async loading
  // return logs[item]; // sync loading
}

function showResult(links) {
  console.log(JSON.stringify(links, null, 2));
  process.exit(0);
}
```

### Result:

```json
[
  {"source": "item1", "target": "item2", "value": 0.25},
  {"source": "item1", "target": "item3", "value": 0.6666666666666666},
  {"source": "item2", "target": "item3", "value": 0.2}
]
```

### Async Loading:

`getLog()` method could return a Promise.

```js
var fs = require("fs");

function getLog(item) {
  return new Promise(function(resolve, reject) {
    var file = "test/example/" + item + ".txt";
    fs.readFile(file, "utf-8", function(err, text) {
      if (err) return reject(err);
      var list = text.split("\n").filter(function(v) {
        return !!v;
      });
      return resolve(list);
    });
  });
}
```

### Jaccard Index:

`index()` method accepts a pair of Arrays and returns a Jaccard index.

```js
var Jaccard = require("jaccard-index");
var jaccard = Jaccard();

var item1 = ["user1", "user2"];
var item2 = ["user2", "user3", "user4"];
var index = jaccard.index(item1, item2);

console.log(index); // => 0.25
```

## CLI

```sh
$ npm install jaccard-index
$ PATH=./node_modules/.bin:$PATH
$ head node_modules/jaccard-index/test/example/*.txt
$ jaccard-index --csv node_modules/jaccard-index/test/example/*.txt
```

## SEE ALSO

### JSDoc

- [https://kawanet.github.io/jaccard-index/Jaccard.html](https://kawanet.github.io/jaccard-index/Jaccard.html)

### NPM

- [https://www.npmjs.com/package/jaccard-index](https://www.npmjs.com/package/jaccard-index)

### GitHub

- [https://github.com/kawanet/jaccard-index](https://github.com/kawanet/jaccard-index)

### Tests

- [https://travis-ci.org/kawanet/jaccard-index](https://travis-ci.org/kawanet/jaccard-index)

## LICENSE

MIT License

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
