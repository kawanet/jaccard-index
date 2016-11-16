#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

describe(TITLE, function() {
  // var Jaccard = require("jaccard-index");

  var logs = {
    "item1": ["user1", "user2"],
    "item2": ["user2", "user3", "user4"],
    "item3": ["user1", "user2", "user5"]
  };

  var source = Object.keys(logs); // item1, item2, item3

  var options = {
    getLog: getLog
  };

  // Jaccard(options).getLinks(source).then(showResult).catch(console.warn);

  function getLog(id) {
    return logs[id];
  }

  var link12 = {source: "item1", target: "item2", value: 0.25};
  var link13 = {source: "item1", target: "item3", value: 2 / 3};
  var link23 = {source: "item2", target: "item3", value: 0.2};

  it("index(sourceLog, targetLog)", function() {
    var jaccard = Jaccard();
    assert.equal(jaccard.index(logs.item1, logs.item2), link12.value);
    assert.equal(jaccard.index(logs.item2, logs.item3), link23.value);
    assert.equal(jaccard.index(logs.item3, logs.item1), link13.value);
  });

  it("getIndex(sourceItem, targetItem)", function() {
    return Jaccard(options).getIndex("item1", "item2").then(check);

    function check(index) {
      assert.deepEqual(index, link12.value);
    }
  });

  it("cachedIndex(sourceItem, targetItem)", function() {
    return Jaccard(options).cachedIndex("item2", "item3").then(check);

    function check(index) {
      assert.deepEqual(index, link23.value);
    }
  });

  it("getLinks(sourceItems, targetItems)", function() {
    return Jaccard(options).getLinks(["item1"], source).then(check);

    function check(links) {
      assert.deepEqual(links, [link12, link13]);
    }
  });

  it("getLinks(sourceItems)", function() {
    return Jaccard(options).getLinks(source).then(check);

    function check(links) {
      assert.deepEqual(links, [link12, link13, link23]);
    }
  });
});
