/* jshint eqnull:true */

var promisen = require("promisen");

module.exports = Jaccard;

/**
 * Promise-based Jaccard similarity coefficient index matrix calculation framework
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
 * Jaccard(options).getMatrix(items).then(showResult).catch(console.warn);
 *
 * function getLog(itemId) {
 *   return Promise.resolve(logs[itemId]); // async
 *   // return logs[itemId]; // sync
 * }
 *
 * function showResult(matrix) {
 *   console.log(JSON.stringify(matrix, null, 2));
 *   process.exit(0);
 * }
 *
 * // Result:
 * // {
 * //   "item1": {"item2": 0.25, "item3": 0.6666666666666666},
 * //   "item2": {"item1": 0.25, "item3": 0.2},
 * //   "item3": {"item1": 0.6666666666666666, "item2": 0.2}
 * // }
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
 * Set null to disable any wait.
 *
 * @type {number|undefined}
 * @default 0
 */

Jaccard.prototype.wait = 0;

/**
 * Time in millisecond to expire caches used in this module.
 * One minute per default.
 * Set null to disable the cache.
 *
 * @type {number}
 * @default 60000
 */

Jaccard.prototype.expire = 60 * 1000;

/**
 * Concurrency to run data loading and index calculating.
 * Only single task each allowed per default.
 * The other tasks would wait to start until the first task completed.
 * Set null to disable the throttle.
 *
 * @type {number}
 * @default 1
 */

Jaccard.prototype.throttle = 1;

/**
 * Timeout in millisecond until receiving result.
 * One minute per default.
 * Set null to disable the timeout.
 *
 * @type {number}
 * @default 60000
 */

Jaccard.prototype.timeout = 60 * 1000;

/**
 * False when source and target are swappable.
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
  if (this.expire) {
    task = promisen.memoize(task, this.expire);
  }
  this.cachedLog = task; // lazy build
  return task.call(this, itemId);
};

/**
 * retrieves a log array.
 * Overriding this method is required before calling getMatrix() or getIndex() methods.
 *
 * @method
 * @param itemId {string}
 * @returns {Array|Promise.<Array>}
 * @example
 * var fs = require("fs");
 * var Jaccard = require("jaccard-index");
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

Jaccard.prototype.getLog = getLog;

/**
 * @private
 */

function getLog(itemId) {
  throw new Error("getLog method not implemented");
}

/**
 * @private
 */

function _getLog(itemId) {
  var logs = this.logs || (this.logs = {});
  var row = logs[itemId];
  if (row) return Object.keys(row);
}

/**
 * imports a transaction.
 * This generates getLog() method.
 *
 * @param itemId {string}
 * @param userId {string}
 */

Jaccard.prototype.addLog = function(itemId, userId) {
  var logs = this.logs;
  if (!logs) {
    if (this.getLog !== getLog) {
      throw new Error("getLog method already implemented");
    }
    logs = this.logs = {};
    this.getLog = _getLog;
    this.getItems = _getItems;
  }
  var row = logs[itemId] || (logs[itemId] = {});
  row[userId]++;
};

/**
 * returns array of items.
 * Override this only when needed.
 *
 * @returns {Array}
 */

Jaccard.prototype.getItems = function() {
  throw new Error("getItems method not implemented");
};

/**
 * @private
 */

function _getItems() {
  if (this.logs) return Object.keys(this.logs);
}

/**
 * returns a matrix of Jaccard index for items given.
 *
 * @param [sourceItems] {Array|Promise.<Array>} array of source items
 * @param [targetItems] {Array|Promise.<Array>} array of target items
 * @param [stream] {WritableStream} stream to write links
 * @returns {Promise.<Object>}
 */

Jaccard.prototype.getMatrix = function(sourceItems, targetItems, stream) {
  var that = this;
  var matrix = {};
  var wait = that.wait && promisen.wait(that.wait);
  var hasFilter = (that.filter !== through);
  var hasStream = stream && !!stream.write;
  var noDirection = !that.direction;
  if (!sourceItems) sourceItems = this.getItems;
  if (!targetItems) targetItems = sourceItems;

  return promisen.eachSeries(sourceItems, sourceIt).call(that).then(done);

  function sourceIt(sourceItem) {
    var row = matrix[sourceItem] || (matrix[sourceItem] = {});
    return promisen.eachSeries(targetItems, targetIt).call(that);

    function targetIt(targetItem) {
      if (sourceItem === targetItem) return;

      var swap = noDirection && (targetItem < sourceItem);
      var job;
      if (swap) {
        job = that.cachedIndex(targetItem, sourceItem); // swapped
      } else {
        job = that.cachedIndex(sourceItem, targetItem);
      }

      if (hasFilter) job = job.then(filter);

      return job.then(then);

      function filter(index) {
        if (index == null) return;
        return that.filter(index, sourceItem, targetItem);
      }

      function then(index) {
        if (index == null) return;
        if (!hasStream) row[targetItem] = index;
        if (hasStream && !swap) stream.write(index);
        return wait && wait();
      }
    }
  }

  function done() {
    if (hasStream && !!stream.end && !stream._isStdio) stream.end();
    return hasStream ? stream : matrix;
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
  if (this.expire) {
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
 * @param sourceLog {Array}
 * @param targetLog {Array}
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

  var shorterLog = (sourceLen < targetLen) ? sourceLog : targetLog;
  var longerLog = (sourceLen < targetLen) ? targetLog : sourceLog;

  var map = {};
  Array.prototype.forEach.call(shorterLog, function(userId) {
    map[userId] = 1;
  });

  var match = 0;
  Array.prototype.forEach.call(longerLog, function(userId) {
    if (map[userId]) match++;
  });

  return match / (sourceLen + targetLen - match);
};

/**
 * returns a Jaccard index value to be placed at the result matrix.
 * This does nothing per default.
 * Override this function to apply a precision or another format.
 * Return null to ignore the index.
 *
 * @method
 * @param index {number} Jaccard index
 * @returns {number|Object}
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
  if (this.throttle) {
    task = promisen.throttle(task, this.throttle, this.timeout);
  } else if (this.timeout) {
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
