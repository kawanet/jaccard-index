#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var logs = {
    foo: ["user1", "user2"],
    bar: ["user2", "user3", "user4"],
    buz: ["user1", "user2", "user5"]
  };

  var source = Object.keys(logs); // foo, bar, buz

  var result = {
    "foo": {"bar": 0.25, "buz": 2 / 3},
    "bar": {"foo": 0.25, "buz": 0.2},
    "buz": {"foo": 2 / 3, "bar": 0.2}
  };

  function getList(id) {
    return logs[id];
  }

  it("direction: true", function() {
    var jaccard = new Jaccard({direction: true, getList: getList});
    jaccard = wrapCalcCounter(jaccard);
    return jaccard.getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
      assert.equal(jaccard._counter, 6);
    }
  });

  it("direction: false", function() {
    var jaccard = new Jaccard({direction: false, getList: getList});
    jaccard = wrapCalcCounter(jaccard);
    return jaccard.getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
      assert.equal(jaccard._counter, 3); // other pairs refer cached results
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
