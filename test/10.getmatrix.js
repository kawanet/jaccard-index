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

  it("getScore(sourceId, targetId)", function() {
    var sourceId = source[0];
    var targetId = source[1];
    return Jaccard(options).getScore(sourceId, targetId).then(check);

    function check(index) {
      assert.deepEqual(result[sourceId][targetId], index);
    }
  });

  it("getMatrix(sourceList, targetList)", function() {
    var sourceId = source[0];
    return Jaccard(options).getMatrix([sourceId], source).then(check);

    function check(matrix) {
      var obj = {};
      obj[sourceId] = result[sourceId];
      assert.deepEqual(matrix, obj);
    }
  });

  it("getMatrix(sourceList)", function() {
    return Jaccard(options).getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });
});
