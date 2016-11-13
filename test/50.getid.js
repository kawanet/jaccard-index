#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var logs = {
    "ITEM1": ["user1", "user2"],
    "ITEM2": ["user2", "user3", "user4"],
    "ITEM3": ["user1", "user2", "user5"]
  };

  var source = Object.keys(logs).map(wrapId);

  var options = {
    getList: getList,
    getId: unwrapId
  };

  function getList(id) {
    return logs[id.ID];
  }

  function wrapId(id) {
    return {ID: id};
  }

  function unwrapId(id) {
    return String.prototype.toLocaleLowerCase.call(id.ID);
  }

  var result = {
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  it("getId", function() {
    return Jaccard(options).getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });
});
