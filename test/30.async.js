#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;
var fs = require("fs");

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var source = ["foo", "bar", "buz"];

  var result = {
    "foo": {"bar": 0.25, "buz": 2 / 3},
    "bar": {"foo": 0.25, "buz": 0.2},
    "buz": {"foo": 2 / 3, "bar": 0.2}
  };

  function getList(id) {
    // return new Promise(then); // Promise
    return {then: then}; // Thenable

    function then(resolve, reject) {
      var file = __dirname + "/example/" + id + ".txt";
      fs.readFile(file, "utf-8", function(err, text) {
        if (err) return reject(err);
        var data = text.split("\n").filter(isTrue);
        return resolve(data);
      });
    }
  }

  it("async", function() {
    var jaccard = new Jaccard({direction: true, getList: getList});
    return jaccard.getMatrix(source).then(check);

    function check(matrix) {
      assert.deepEqual(matrix, result);
    }
  });
});

function isTrue(v) {
  return !!v;
}
