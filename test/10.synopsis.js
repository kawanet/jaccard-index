#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  it("synopsis", function() {

    // var Jaccard = require("jaccard-index");

    var logs = {
      foo: ["user1", "user2"],
      bar: ["user2", "user3", "user4"],
      buz: ["user1", "user2", "user5"]
    };

    var source = Object.keys(logs); // foo, bar, buz

    var result = {
      "foo": {"bar": 0.25, "buz": 0.667},
      "bar": {"foo": 0.25, "buz": 0.2},
      "buz": {"foo": 0.667, "bar": 0.2}
    };

    var options = {
      direction: false,
      expire: 1000,
      getList: getList
    };

    // accard(options).getMatrix(source).then(showResult).catch(console.warn);
    return Jaccard(options).getMatrix(source).then(showResult);

    function getList(id) {
      // return Promise.resolve(logs[id]); // async
      return logs[id]; // sync
    }

    function showResult(matrix) {
      // console.log(JSON.stringify(matrix, null, 1));
      assert.deepEqual(matrix, result);
    }
  });
});
