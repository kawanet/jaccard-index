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
    console.warn("Module not found: " + name);
  }
}

describe(TITLE, function() {
  var ectoIt = EctoJaccard ? it : it.skip;
  var godofIt = GodofKimJaccard ? it : it.skip;

  var logs = {
    foo: ["user1", "user2"],
    bar: ["user2", "user3", "user4"],
    buz: ["user1", "user2", "user5"]
  };

  var result = {
    "foo": {"bar": 0.25, "buz": 2 / 3},
    "bar": {"foo": 0.25, "buz": 0.2},
    "buz": {"foo": 2 / 3, "bar": 0.2}
  };

  it("kawanet/jaccard-index", function() {
    var jaccard = Jaccard();
    assert.equal(jaccard.index(logs.foo, logs.bar), result.foo.bar);
    assert.equal(jaccard.index(logs.bar, logs.buz), result.bar.buz);
    assert.equal(jaccard.index(logs.buz, logs.foo), result.buz.foo);
  });

  ectoIt("ecto/jaccard", function() {
    assert.equal(EctoJaccard.index(logs.foo, logs.bar), result.foo.bar);
    assert.equal(EctoJaccard.index(logs.bar, logs.buz), result.bar.buz);
    assert.equal(EctoJaccard.index(logs.buz, logs.foo), result.buz.foo);
  });

  godofIt("GodofKim/multiset-jaccard", function() {
    var usePolyfill = !Object.values;
    if (usePolyfill) Object.values = polyfillObjectValues;
    assert.equal(GodofKimJaccard.index(logs.foo, logs.bar), result.foo.bar);
    assert.equal(GodofKimJaccard.index(logs.bar, logs.buz), result.bar.buz);
    assert.equal(GodofKimJaccard.index(logs.buz, logs.foo), result.buz.foo);
    if (usePolyfill) delete Object.values;
  });
});

function polyfillObjectValues(object) {
  return Object.keys(object).map(function(key) {
    return object[key];
  });
}