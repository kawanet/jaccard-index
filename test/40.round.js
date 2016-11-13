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

  function getList(id) {
    return logs[id];
  }

  it("0.01", function() {
    var options = {
      getList: getList,
      round: round
    };

    var result = {
      "foo": {"bar": 0.3, "buz": 0.7},
      "bar": {"foo": 0.3, "buz": 0.2},
      "buz": {"foo": 0.7, "bar": 0.2}
    };

    return Jaccard(options).getMatrix(source).then(check);

    function round(score) {
      return Math.round(score * 10) / 10;
    }

    function check(score) {
      assert.deepEqual(result, score);
    }
  });

  it("round: null", function() {
    var options = {
      getList: getList,
      round: null
    };

    var result = {
      "foo": {"bar": 0.25, "buz": 2 / 3},
      "bar": {"foo": 0.25, "buz": 0.2},
      "buz": {"foo": 2 / 3, "bar": 0.2}
    };

    return Jaccard(options).getMatrix(source).then(check);

    function check(score) {
      assert.deepEqual(result, score);
    }
  });
});
