#!/usr/bin/env mocha

/* jshint mocha:true */

var Jaccard = require("../");
var EctoJaccard = try_require("jaccard");
var GodofKimJaccard = try_require("multiset-jaccard");
var assert = require("chai").assert;

var TITLE = __filename.replace(/^.*\//, "");

function try_require(name) {
  try {
    return require(name);
  } catch (e) {
    // console.warn("Module not loaded: " + name);
  }
}

describe(TITLE, function() {
  var ectoIt = EctoJaccard ? it : it.skip;
  var godofIt = GodofKimJaccard ? it : it.skip;

  var logs = {
    "item1": ["user1", "user2"],
    "item2": ["user2", "user3", "user4"],
    "item3": ["user1", "user2", "user5"]
  };

  var result = {
    "item1": {"item2": 0.25, "item3": 2 / 3},
    "item2": {"item1": 0.25, "item3": 0.2},
    "item3": {"item1": 2 / 3, "item2": 0.2}
  };

  it("kawanet/jaccard-index", function() {
    var jaccard = Jaccard();
    assert.equal(jaccard.index(logs.item1, logs.item2), result.item1.item2);
    assert.equal(jaccard.index(logs.item2, logs.item3), result.item2.item3);
    assert.equal(jaccard.index(logs.item3, logs.item1), result.item3.item1);
  });

  ectoIt("ecto/jaccard" + (EctoJaccard ? "" : ": Module not loaded"), function() {
    assert.equal(EctoJaccard.index(logs.item1, logs.item2), result.item1.item2);
    assert.equal(EctoJaccard.index(logs.item2, logs.item3), result.item2.item3);
    assert.equal(EctoJaccard.index(logs.item3, logs.item1), result.item3.item1);
  });

  godofIt("GodofKim/multiset-jaccard" + (GodofKimJaccard ? "" : ": Module not loaded"), function() {
    var usePolyfill = !Object.values;
    if (usePolyfill) Object.values = polyfillObjectValues;
    assert.equal(GodofKimJaccard.index(logs.item1, logs.item2), result.item1.item2);
    assert.equal(GodofKimJaccard.index(logs.item2, logs.item3), result.item2.item3);
    assert.equal(GodofKimJaccard.index(logs.item3, logs.item1), result.item3.item1);
    if (usePolyfill) delete Object.values;
  });
});

function polyfillObjectValues(object) {
  return Object.keys(object).map(function(key) {
    return object[key];
  });
}