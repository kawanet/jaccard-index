#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;
var fs = require("fs");

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  var source = ["item1", "item2", "item3"];

  var link12 = {source: "item1", target: "item2", value: 0.25};
  var link13 = {source: "item1", target: "item3", value: 2 / 3};
  var link23 = {source: "item2", target: "item3", value: 0.2};
  var expected = [link12, link13, link23];

  function getLog(id) {
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
    var jaccard = new Jaccard({getLog: getLog});
    return jaccard.getLinks(source).then(check);

    function check(links) {
      assert.deepEqual(links, expected);
    }
  });
});

function isTrue(v) {
  return !!v;
}
