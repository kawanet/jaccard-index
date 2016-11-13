#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var logs = {
    FOO: ["user1", "user2"],
    BAR: ["user2", "user3", "user4"],
    BUZ: ["user1", "user2", "user5"]
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
    "foo": {"bar": 0.25, "buz": 0.667},
    "bar": {"foo": 0.25, "buz": 0.2},
    "buz": {"foo": 0.667, "bar": 0.2}
  };

  it("getId", function() {
    return Jaccard(options).getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });
});
