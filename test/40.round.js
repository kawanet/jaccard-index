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

  it("0.001", function() {
    var options = {
      getList: getList,
      round: round
    };

    var result = {
      "foo": {"bar": 0.25, "buz": 0.667},
      "bar": {"foo": 0.25, "buz": 0.2},
      "buz": {"foo": 0.667, "bar": 0.2}
    };

    return Jaccard(options).getMatrix(source).then(check);

    function round(index) {
      return Math.round(index * 1000) / 1000;
    }

    function check(matrix) {
      assert.deepEqual(result, matrix);
    }
  });
});
