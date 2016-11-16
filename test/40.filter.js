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

    var link12 = {source: "item1", target: "item2", value: 0.3};
    var link13 = {source: "item1", target: "item3", value: 0.7};
    var link23 = {source: "item2", target: "item3", value: 0.2};
    var expected = [link12, link13, link23];

    return Jaccard(options).getLinks(source).then(check);

    function filter(index) {
      return Math.round(index * 10) / 10;
    }

    function check(links) {
      assert.deepEqual(links, expected);
    }
  });

  it("conditional", function() {
    var options = {
      getLog: getLog,
      filter: filter
    };

    var link12 = {source: "item1", target: "item2", value: 0.25};
    var link13 = {source: "item1", target: "item3", value: 2 / 3};
    var expected = [link12, link13];

    return Jaccard(options).getLinks(source).then(check);

    function filter(index) {
      return index > 0.2 ? index : null;
    }

    function check(links) {
      assert.deepEqual(links, expected);
    }
  });

  it("filter(index, sourceItem, targetItem)", function() {
    var options = {
      getLog: getLog,
      filter: filter
    };

    var link12 = {source: "item1", target: "item2", value: "item1/item2/25%"};
    var link13 = {source: "item1", target: "item3", value: "item1/item3/66%"};
    var link23 = {source: "item2", target: "item3", value: "item2/item3/20%"};
    var expected = [link12, link13, link23];

    return Jaccard(options).getLinks(source).then(check);

    function filter(index, sourceItem, targetItem) {
      return [sourceItem, targetItem, Math.floor(index * 100) + "%"].join("/");
    }

    function check(links) {
      assert.deepEqual(links, expected);
    }
  });
});
