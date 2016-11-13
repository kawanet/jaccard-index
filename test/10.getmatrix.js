#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  // var Jaccard = require("jaccard-index");

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

  // Jaccard(options).getMatrix(source).then(showResult).catch(console.warn);

  function getList(id) {
    return logs[id];
  }

  var result = {
    "foo": {"bar": 0.25, "buz": 2 / 3},
    "bar": {"foo": 0.25, "buz": 0.2},
    "buz": {"foo": 2 / 3, "bar": 0.2}
  };

  it("index(sourceLog, targetLog)", function() {
    var jaccard = Jaccard();
    assert.equal(jaccard.index(logs.foo, logs.bar), result.foo.bar);
    assert.equal(jaccard.index(logs.bar, logs.buz), result.bar.buz);
    assert.equal(jaccard.index(logs.buz, logs.foo), result.buz.foo);
  });

  it("getIndex(sourceId, targetId)", function() {
    return Jaccard(options).getIndex("foo", "bar").then(check);

    function check(index) {
      assert.deepEqual(result.foo.bar, index);
    }
  });

  it("cachedIndex(sourceId, targetId)", function() {
    return Jaccard(options).cachedIndex("bar", "buz").then(check);

    function check(index) {
      assert.deepEqual(result.bar.buz, index);
    }
  });

  it("getMatrix(sourceList)", function() {
    return Jaccard(options).getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });

  it("getMatrix(sourceList, targetList)", function() {
    return Jaccard(options).getMatrix(["foo"], source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, {foo: result.foo});
    }
  });

  it("cachedMatrix(sourceList, targetList)", function() {
    return Jaccard(options).cachedMatrix(["bar"], source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, {bar: result.bar});
    }
  });
});
