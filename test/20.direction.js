#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var logs = {
    "item1": ["user1", "user2"],
    "item2": ["user2", "user3", "user4"],
    "item3": ["user1", "user2", "user5"]
  };

  var source = Object.keys(logs); // item1, item2, item3

  var result = {
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  function getLog(id) {
    return logs[id];
  }

  it("direction: true", function() {
    var jaccard = new Jaccard({direction: true, getLog: getLog});
    jaccard = wrapCalcCounter(jaccard);
    var stream = createCounterStream();
    return jaccard.getMatrix(source, null, stream).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
      assert.equal(jaccard._counter, 6);
      assert.ok(stream._end);
      assert.equal(stream._counter, 6);
    }
  });

  it("direction: false", function() {
    var jaccard = new Jaccard({direction: false, getLog: getLog});
    jaccard = wrapCalcCounter(jaccard);
    var stream = createCounterStream();
    return jaccard.getMatrix(source, null, stream).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
      assert.equal(jaccard._counter, 3); // other pairs refer cached results
      assert.ok(stream._end);
      assert.equal(stream._counter, 3);
    }
  });

  function wrapCalcCounter(jaccard) {
    var _index = jaccard.index;
    jaccard.index = index; // override
    jaccard._counter = 0;
    return jaccard;

    function index(source, target) {
      this._counter++;
      return _index.call(this, source, target);
    }
  }
});

function createCounterStream() {
  var stream = {write: write, end: end, _counter: 0};
  return stream;

  function write() {
    stream._counter++;
  }

  function end() {
    stream._end = true;
  }
}