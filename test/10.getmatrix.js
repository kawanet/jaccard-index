#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  // var Jaccard = require("jaccard-index");

  var logs = {
    "item1": ["user1", "user2"],
    "item2": ["user2", "user3", "user4"],
    "item3": ["user1", "user2", "user5"]
  };

  var source = Object.keys(logs); // item1, item2, item3

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
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  it("index(sourceLog, targetLog)", function() {
    var jaccard = Jaccard();
    assert.equal(jaccard.index(logs.item1, logs.item2), result.item1.item2);
    assert.equal(jaccard.index(logs.item2, logs.item3), result.item2.item3);
    assert.equal(jaccard.index(logs.item3, logs.item1), result.item3.item1);
  });

  it("getIndex(sourceId, targetId)", function() {
    return Jaccard(options).getIndex("item1", "item2").then(check);

    function check(index) {
      assert.deepEqual(result.item1.item2, index);
    }
  });

  it("cachedIndex(sourceId, targetId)", function() {
    return Jaccard(options).cachedIndex("item2", "item3").then(check);

    function check(index) {
      assert.deepEqual(result.item2.item3, index);
    }
  });

  it("getMatrix(sourceList)", function() {
    return Jaccard(options).getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });

  it("getMatrix(sourceList, targetList)", function() {
    return Jaccard(options).getMatrix(["item1"], source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, {"item1": result.item1});
    }
  });

  it("cachedMatrix(sourceList, targetList)", function() {
    return Jaccard(options).cachedMatrix(["item2"], source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, {"item2": result.item2});
    }
  });
});
