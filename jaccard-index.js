/* jshint eqnull:true */

var promisen = require("promisen");

module.exports = Jaccard;

/**
 * @private
 */

var _SEP = "\x00";

/**
 * Promise-based Jaccard similarity coefficient index calculation framework
 *
 * @param [options] {Object}
 * @returns {Jaccard}
 * @constructor
 * @example
 * #!/usr/bin/env node
 *
 * var Jaccard = require("jaccard-index");
 *
 * var logs = {
 *   "item1": ["user1", "user2"],
 *   "item2": ["user2", "user3", "user4"],
 *   "item3": ["user1", "user2", "user5"]
 * };
 *
 * var items = Object.keys(logs); // item1, item2, item3
 *
 * var options = {
 *   getLog: getLog
 * };
 *
 * Jaccard(options).getLinks(items).then(showResult).catch(console.warn);
 *
 * function getLog(itemId) {
 *   return Promise.resolve(logs[itemId]); // async
 *   // return logs[itemId]; // sync
 * }
 *
 * function showResult(links) {
 *   console.log(JSON.stringify(links, null, 2));
 *   process.exit(0);
 * }
 *
 * // Result:
 * // [
 * //   {"source": "item1", "target": "item2", "value": 0.25},
 * //   {"source": "item1", "target": "item3", "value": 0.6666666666666666},
 * //   {"source": "item2", "target": "item3", "value": 0.2}
 * // ]
 */

function Jaccard(options) {
  if (!(this instanceof Jaccard)) return new Jaccard(options);

  var that = this;
  if (options) Object.keys(options).forEach(function(key) {
    that[key] = options[key];
  });
}

/**
 * Time in millisecond to wait between each calculating iteration to avoid Node process locked.
 * Set null to disable any additional wait.
 *
 * @type {number|null}
 * @default 0
 */

Jaccard.prototype.wait = null;

/**
 * Time in millisecond to expire cached results.
 * Set null to disable the cache feature.
 *
 * @type {number|null}
 * @default null
 */

Jaccard.prototype.expire = null;

/**
 * Concurrency to run data loading and index calculating.
 * Only single task each allowed per default.
 * The other tasks would wait to start until the first task completed.
 * Set null to disable the throttle.
 *
 * @type {number|null}
 * @default 1
 */

Jaccard.prototype.throttle = 1;

/**
 * Timeout in millisecond until receiving a result.
 * Set null to disable the timeout.
 *
 * @type {number|null}
 * @default null
 */

Jaccard.prototype.timeout = null;

/**
 * Set false when source and target are swappable.
 * Set true when they have a direction.
 *
 * @type {boolean}
 * @default false
 */

Jaccard.prototype.direction = false;

/**
 * retrieves a log array with the built-in cache mechanism.
 * This calls getLog() method when the cache not available.
 *
 * @param itemId {string}
 * @returns {Promise.<Array>}
 */

Jaccard.prototype.cachedLog = function(itemId) {
  var task = wrap.call(this, this.getLog);
  if (this.expire >= 0) {
    task = promisen.memoize(task, this.expire);
  }
  this.cachedLog = task; // lazy build
  return task.call(this, itemId);
};

/**
 * retrieves a log array.
 * Overriding this method is required before calling getLinks() or getIndex() methods.
 *
 * @method
 * @param itemId {string}
 * @returns {Array.<string>|Promise.<Array>}
 * @example
 * var fs = require("fs");
 * var Jaccard = require("jaccard-index");
 *
 * var jaccard = Jaccard();
 *
 * jaccard.getLog = getLog;
 *
 * function getLog(itemId) {
 *   return new Promise(function(resolve, reject) {
 *     var file = "test/example/" + itemId + ".txt";
 *     fs.readFile(file, "utf-8", function(err, text) {
 *       if (err) return reject(err);
 *       var data = text.split("\n").filter(function(v) {
 *         return !!v;
 *       });
 *       return resolve(data);
 *     });
 *   });
 * }
 */

Jaccard.prototype.getLog = function(itemId) {
  throw new Error("getLog method not implemented");
};

/**
 * returns array of all items.
 * Override this only when needed.
 *
 * @returns {Array.<string>}
 */

Jaccard.prototype.getItems = function() {
  throw new Error("getItems method not implemented");
};

/**
 * returns an Array of Jaccard index of each links.
 *
 * @param [sourceItems] {Array.<string>|Promise.<Array>} array of source items
 * @param [targetItems] {Array.<string>|Promise.<Array>} array of target items
 * @param [onLink] {Function} function(index, sourceItem, targetItem) {...}
 * @returns {Promise.<Array>}
 */

Jaccard.prototype.getLinks = function(sourceItems, targetItems, onLink) {
  var that = this;
  var links;
  var check = {};
  var wait = (that.wait >= 0) && promisen.wait(that.wait);
  var hasFilter = (that.filter !== through);
  var noDirection = !that.direction;
  if (!sourceItems) sourceItems = that.getItems;
  if (!targetItems) targetItems = sourceItems;
  if (!onLink) onLink = _onLink;

  return promisen.eachSeries(sourceItems, sourceIt).call(that).then(done);

  function sourceIt(sourceItem) {
    return promisen.eachSeries(targetItems, targetIt).call(that);

    function targetIt(targetItem) {
      if (sourceItem === targetItem) return;

      if (noDirection) {
        var asc = sourceItem + _SEP + targetItem;
        var desc = targetItem + _SEP + sourceItem;
        if (check[asc] || check[desc]) return;
        check[asc] = check[desc] = 1;
      }

      var job = that.cachedIndex(sourceItem, targetItem);
      if (hasFilter) job = job.then(filter);
      job = job.then(link);
      if (wait) job = job.then(wait);
      return job;

      function filter(index) {
        if (index == null) return;
        return that.filter(index, sourceItem, targetItem);
      }

      function link(index) {
        if (index == null) return;
        return onLink.call(that, index, sourceItem, targetItem);
      }
    }
  }

  function _onLink(index, sourceItem, targetItem) {
    if (!links) links = [];
    links.push({source: sourceItem, target: targetItem, value: index});
  }

  function done() {
    return links;
  }
};

/**
 * returns a Promise for Jaccard index between the pair of items with the built-in cache mechanism.
 * This calls getIndex() method when the cache not available.
 *
 * @param sourceItem {string}
 * @param targetItem {string}
 * @returns {Promise.<number|undefined>}
 */

Jaccard.prototype.cachedIndex = function(sourceItem, targetItem) {
  var task = wrap.call(this, this.getIndex);
  if (this.expire >= 0) {
    task = memoize(task, this.expire);
  }
  this.cachedIndex = task; // lazy build
  return task.call(this, sourceItem, targetItem);
};

/**
 * returns a Promise for Jaccard index between the pair of items.
 *
 * @param sourceItem {string}
 * @param targetItem {string}
 * @returns {Promise.<number|undefined>}
 */

Jaccard.prototype.getIndex = function(sourceItem, targetItem) {
  var that = this;

  return that.cachedLog(sourceItem).then(function(sourceLog) {
    if (!sourceLog) return;
    return that.cachedLog(targetItem).then(function(targetLog) {
      if (!targetLog) return;
      return that.index(sourceLog, targetLog);
    });
  });
};

/**
 * calculates a Jaccard index between a pair of Arrays.
 * Override this when you need any other index method than Jaccard index.
 *
 * @param sourceLog {Array.<string>}
 * @param targetLog {Array.<string>}
 * @returns {number|undefined|Promise.<number|undefined>}
 * @example
 * var Jaccard = require("jaccard-index");
 * var jaccard = Jaccard();
 *
 * var item1 = ["user1", "user2"];
 * var item2 = ["user2", "user3", "user4"];
 * var index = jaccard.index(item1, item2);
 *
 * console.log(index); // => 0.25
 */

Jaccard.prototype.index = function(sourceLog, targetLog) {
  if (!sourceLog) return;
  if (!targetLog) return;

  var sourceLen = sourceLog.length;
  var targetLen = targetLog.length;

  if (!sourceLen) return;
  if (!targetLen) return;

  var match = (sourceLen < targetLen) ? count(sourceLog, targetLog) : count(targetLog, sourceLog);

  return match / (sourceLen + targetLen - match);
};

/**
 * @private
 */

function count(shorterLog, longerLog) {
  var map = {};
  Array.prototype.forEach.call(shorterLog, function(userId) {
    map[userId] = 1;
  });

  var both = {};
  Array.prototype.forEach.call(longerLog, function(userId) {
    if (map[userId]) both[userId] = 1;
  });

  return Object.keys(both).length;
}

/**
 * returns a Jaccard index value to be placed at the result.
 * This does nothing per default.
 * Override this function to apply a precision or another format.
 * Return null to ignore the index.
 *
 * @method
 * @param index {number} Jaccard index
 * @returns {number|null|any}
 * @example
 * jaccard.filter = function(index) {
 *   return Math.filter(index * 1000) / 1000;
 * };
 * @example
 * jaccard.filter = function(index) {
 *   return (index > 0.001) ? index : null;
 * };
 */

Jaccard.prototype.filter = through;

/**
 * @private
 */

function wrap(task) {
  if (this.throttle >= 0) {
    task = promisen.throttle(task, this.throttle, this.timeout);
  } else if (this.timeout >= 0) {
    task = promisen.timeout(task, this.timeout);
  } else {
    task = promisen(task);
  }
  return task;
}

/**
 * @private
 */

function memoize(task, expire) {
  var memo = promisen.memoize(unwrap, expire);
  return enwrap;

  function enwrap() {
    var array = Array.prototype.slice.call(arguments);
    return memo.call(this, array); // single argument required
  }

  function unwrap(array) {
    return task.apply(this, array); // multiple arguments allowed
  }
}

/**
 * @private
 */

function through(value) {
  return value;
}
