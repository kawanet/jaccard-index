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

  function getList(id) {
    return logs[id];
  }

  it("0.001", function() {
    var options = {
      getList: getList,
      round: round
    };

    var result = {
      "item1": {"item2": 0.25, "item3": 0.667},
      "item2": {"item1": 0.25, "item3": 0.2},
      "item3": {"item1": 0.667, "item2": 0.2}
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
