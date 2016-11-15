#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var logs = [
    ["item1", "user1"],
    ["item2", "user2"],
    ["item3", "user1"],
    ["item1", "user2"],
    ["item2", "user3"],
    ["item3", "user2"],
    ["item2", "user4"],
    ["item3", "user5"]
  ];

  var result = {
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  it("addLog", function() {
    var jaccard = Jaccard();
    logs.forEach(function(row) {
      jaccard.addLog(row[0], row[1]);
    });
    return jaccard.getMatrix().then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });
});
