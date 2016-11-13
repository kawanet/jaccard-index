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
 * var source = Object.keys(logs); // item1, item2, item3
 *
 * var options = {
 *   direction: false,
 *   expire: 1000,
 *   getList: getList
 * };
 *
 * Jaccard(options).getMatrix(source).then(showResult).catch(console.warn);
 *
 * function getList(id) {
 *   return Promise.resolve(logs[id]); // async
 *   // return logs[id]; // sync
 * }
 *
 * function showResult(matrix) {
 *   console.log(JSON.stringify(matrix, null, 1));
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
 * Set undefined to disable any wait.
 *
 * @type {number|undefined}
 * @default 0
 */

Jaccard.prototype.wait = 0;

/**
 * Time in millisecond to expire caches used in this module.
 * One minute per default.
 *
 * @type {number}
 * @default 60000
 */

Jaccard.prototype.expire = 60 * 1000;

/**
 * Concurrency to run calculating.
 * Only single task allowed per default.
 * The other tasks will wait until the first task completed.
 * Set 0 when no throttle limitation needed.
 *
 * @type {number}
 * @default 1
 */

Jaccard.prototype.throttle = 1;

/**
 * Timeout in millisecond until receiving result.
 * One minute per default.
 *
 * @type {number}
 * @default 60000
 */

Jaccard.prototype.timeout = 60 * 1000;

/**
 * returns a hash string made from ID object.
 * The built-in cache mechanism works with the hash string.
 * Override this only when you need any other hash function than JSON.stringify().
 *
 * @method
 * @param id {string|Object}
 * @returns {string}
 */

Jaccard.prototype.getIdHash = JSON.stringify.bind(JSON);

/**
 * False when source and target are swappable.
 * Set true when they have a direction.
 *
 * @type {boolean}
 * @default false
 */

Jaccard.prototype.direction = false;

/**
 * retrieves an array for ID with the built-in cache mechanism.
 * This calls getList() method when the cache not available.
 *
 * @param id {string|Object} ID string or object
 * @returns {Promise.<Array>}
 */

Jaccard.prototype.cachedList = function(id) {
  var task = this.cachedList = wrap.call(this, this.getList); // lazy build
  return task.call(this, id);
};

/**
 * retrieves an array for ID.
 * Overriding this method is required before calling getMatrix() or getIndex() methods.
 *
 * @param id {string|Object} ID string or object
 * @returns {Array|Promise.<Array>}
 * @example
 * var fs = require("fs");
 * var Jaccard = require("jaccard-index");
 * var jaccard = Jaccard();
 *
 * jaccard.getList = getList;
 *
 * function getList(id) {
 *   return new Promise(function(resolve, reject) {
 *     var file = "test/example/" + id + ".txt";
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

Jaccard.prototype.getList = function(id) {
  throw new Error("getList function not implemented");
};

/**
 * returns a matrix of Jaccard index for given IDs with the built-in cache mechanism.
 * This calls getMatrix() method when the cache not available.
 *
 * @param sourceList {Array} array of source IDs
 * @param [targetList] {Array} array of target IDs
 * @returns {Promise.<Object>}
 */

Jaccard.prototype.cachedMatrix = function(sourceList, targetList) {
  var task = this.cachedMatrix = wrap.call(this, this.getMatrix); // lazy build
  return task.call(this, sourceList, targetList);
};

/**
 * returns a matrix of Jaccard index for given IDs.
 *
 * @param sourceList {Array} array of source IDs
 * @param [targetList] {Array} array of target IDs
 * @returns {Promise.<Object>}
 */

Jaccard.prototype.getMatrix = function(sourceList, targetList) {
  var that = this;
  var matrix = {};
  var wait = that.wait && promisen.wait(that.wait);
  var hasGetId = (that.getId !== through);
  var hasRound = (that.round !== through);
  if (!targetList) targetList = sourceList;

  return promisen.eachSeries(sourceList, sourceIt)().then(done);

  function sourceIt(sourceId) {
    var sourceKey = that.getId ? that.getId(sourceId) : sourceId;
    var row = matrix[sourceKey] || (matrix[sourceKey] = {});
    return promisen.eachSeries(targetList, targetIt)();

    function targetIt(targetId) {
      var targetKey = hasGetId ? that.getId(targetId) : targetId;
      if (sourceKey === targetKey) return;

      if (!that.direction && targetId < sourceId) {
        return that.cachedIndex(targetId, sourceId).then(then); // swapped
      } else {
        return that.cachedIndex(sourceId, targetId).then(then);
      }

      function then(index) {
        if (index == null) return;
        row[targetKey] = hasRound ? that.round(index) : index;
        return wait && wait();
      }
    }
  }

  function done() {
    return matrix;
  }
};

/**
 * returns a Promise for Jaccard index between the pair of IDs with the built-in cache mechanism.
 * This calls getIndex() method when the cache not available.
 *
 * @param sourceId {string|Object}
 * @param targetId {string|Object}
 * @returns {Promise.<number|undefined>}
 */

Jaccard.prototype.cachedIndex = function(sourceId, targetId) {
  var task = this.cachedIndex = wrap.call(this, this.getIndex); // lazy build
  return task.call(this, sourceId, targetId);
};

/**
 * returns a Promise for Jaccard index between the pair of IDs.
 *
 * @param sourceId {string|Object}
 * @param targetId {string|Object}
 * @returns {Promise.<number|undefined>}
 */

Jaccard.prototype.getIndex = function(sourceId, targetId) {
  var that = this;

  return that.cachedList(sourceId).then(function(sourceLog) {
    if (!sourceLog) return;
    return that.cachedList(targetId).then(function(targetLog) {
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
  Array.prototype.forEach.call(shorterLog, function(id) {
    map[id] = 1;
  });

  var match = 0;
  Array.prototype.forEach.call(longerLog, function(id) {
    if (map[id]) match++;
  });

  return match / (sourceLen + targetLen - match);
};

/**
 * stringify ID object to be placed at the result matrix.
 * Just pass through per default.
 *
 * @method
 * @param id {string|Object} ID string or object
 * @returns {string}
 * @example
 * jaccard.getId = function(id) {
 *   return id.toUpperCase();
 * };
 */

Jaccard.prototype.getId = through;

/**
 * returns an Jaccard index number rounded to be placed at the result matrix.
 * This does nothing per default.
 * Override this function to apply any precision.
 *
 * @method
 * @param index {number} Jaccard index
 * @returns {number}
 * @example
 * jaccard.round = function(index) {
 *   return Math.round(index * 1000) / 1000;
 * };
 */

Jaccard.prototype.round = through;

/**
 * @private
 */

function wrap(func) {
  var task = run;
  if (this.throttle || this.timeout) {
    task = promisen.throttle(task, this.throttle, this.timeout);
  } else {
    task = promisen(task);
  }
  if (this.expire) {
    task = promisen.memoize(task, this.expire, this.getIdHash);
  }
  return wrapped;

  function wrapped() {
    var arg = Array.prototype.slice.call(arguments);
    return task.call(this, arg); // single argument requested
  }

  function run(arg) {
    return func.apply(this, arg); // multiple arguments allowed
  }
}

/**
 * @private
 */

function through(value) {
  return value;
}
