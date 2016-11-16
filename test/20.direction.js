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

  var items = Object.keys(logs); // item1, item2, item3

  var link12 = {source: "item1", target: "item2", value: 0.25};
  var link13 = {source: "item1", target: "item3", value: 2 / 3};
  var link21 = {source: "item2", target: "item1", value: 0.25};
  var link23 = {source: "item2", target: "item3", value: 0.2};
  var link31 = {source: "item3", target: "item1", value: 2 / 3};
  var link32 = {source: "item3", target: "item2", value: 0.2};

  function getLog(id) {
    return logs[id];
  }

  it("direction: true", function() {
    var jaccard = new Jaccard({direction: true, getLog: getLog});
    jaccard = wrapCalcCounter(jaccard);
    return jaccard.getLinks(items).then(check);

    function check(links) {
      var expected = [link12, link13, link21, link23, link31, link32];
      assert.deepEqual(links, expected);
      assert.equal(jaccard._counter, 6);
    }
  });

  it("direction: false", function() {
    var jaccard = new Jaccard({direction: false, getLog: getLog});
    jaccard = wrapCalcCounter(jaccard);
    return jaccard.getLinks(items).then(check);

    function check(links) {
      var expected = [link12, link13, link23];
      assert.deepEqual(links, expected);
      assert.equal(jaccard._counter, 3); // other pairs refer cached results
    }
  });

  function wrapCalcCounter(jaccard) {
    var _index = jaccard.index;
    jaccard.index = index; // override
    jaccard._counter = 0;
    return jaccard;

    function index(items, target) {
      this._counter++;
      return _index.call(this, items, target);
    }
  }
});
