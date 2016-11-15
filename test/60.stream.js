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

  var items = Object.keys(logs); // item1, item2, item3

  var result = {
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  function getLog(id) {
    return logs[id];
  }

  it("direction: true", function() {
    var jaccard = new Jaccard({direction: true, getLog: getLog, filter: filter});
    var stream = createPseudoStream();
    return jaccard.getMatrix(items, null, stream).then(check);

    function filter(index, source, target) {
      assert.ok(result[source][target], index);
      return [source, target, index];
    }

    function check() {
      assert.ok(stream._end);
      assert.equal(stream._buf.length, 6);
    }
  });

  it("direction: false", function() {
    var jaccard = new Jaccard({direction: false, getLog: getLog, filter: filter});
    var stream = createPseudoStream();
    return jaccard.getMatrix(items, null, stream).then(check);

    function filter(index, source, target) {
      assert.equal(result[source][target], index);
      return [source, target, index];
    }

    function check() {
      assert.ok(stream._end);
      assert.equal(stream._buf.length, 3);
    }
  });
});

function createPseudoStream() {
  var stream = {write: write, end: end, _buf: []};
  return stream;

  function write(chunk) {
    assert.ok(chunk instanceof Array);
    assert.equal(chunk.length, 3);
    stream._buf.push(chunk);
  }

  function end() {
    stream._end = true;
  }
}