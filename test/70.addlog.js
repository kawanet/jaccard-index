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

  var link12 = {source: "item1", target: "item2", value: 0.25};
  var link13 = {source: "item1", target: "item3", value: 2 / 3};
  var link23 = {source: "item2", target: "item3", value: 0.2};
  var expected = [link12, link13, link23];

  it("addLog", function() {
    var jaccard = Jaccard();
    logs.forEach(function(row) {
      jaccard.addLog(row[0], row[1]);
    });
    return jaccard.getLinks().then(check);

    function check(links) {
      assert.deepEqual(links, expected);
    }
  });
});
