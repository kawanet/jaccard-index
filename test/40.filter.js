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

  function getLog(id) {
    return logs[id];
  }

  it("Math.floor()", function() {
    var options = {
      getLog: getLog,
      filter: filter
    };

    var result = {
      "item1": {"item2": 0.25, "item3": 0.667},
      "item2": {"item1": 0.25, "item3": 0.2},
      "item3": {"item1": 0.667, "item2": 0.2}
    };

    return Jaccard(options).getMatrix(source, source).then(check);

    function filter(index) {
      return Math.round(index * 1000) / 1000;
    }

    function check(matrix) {
      assert.deepEqual(result, matrix);
    }
  });

  it("conditional", function() {
    var options = {
      getLog: getLog,
      filter: filter
    };

    var result = {
      "item1": {"item2": 0.25, "item3": 2 / 3},
      "item2": {"item1": 0.25},
      "item3": {"item1": 2 / 3}
    };

    return Jaccard(options).getMatrix(source, source).then(check);

    function filter(index) {
      return index > 0.2 ? index : null;
    }

    function check(matrix) {
      assert.deepEqual(result, matrix);
    }
  });

  it("filter(index, sourceItem, targetItem)", function() {
    var options = {
      getLog: getLog,
      filter: filter
    };

    var result = {
      "item1": {"item2": "item1/item2/25%", "item3": "item1/item3/66%"},
      "item2": {"item1": "item2/item1/25%", "item3": "item2/item3/20%"},
      "item3": {"item1": "item3/item1/66%", "item2": "item3/item2/20%"}
    };

    return Jaccard(options).getMatrix(source).then(check);

    function filter(index, sourceItem, targetItem) {
      return [sourceItem, targetItem, Math.floor(index * 100) + "%"].join("/");
    }

    function check(matrix) {
      assert.deepEqual(result, matrix);
    }
  });
});
