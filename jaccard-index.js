/* jshint eqnull:true */

var promisen = require("promisen");

module.exports = Jaccard;

/**
 * Promise-based Jaccard similarity coefficient index matrix calculation
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
 *   foo: ["user1", "user2"],
 *   bar: ["user2", "user3", "user4"],
 *   buz: ["user1", "user2", "user5"]
 * };
 *
 * var source = Object.keys(logs); // foo, bar, buz
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
 * //   "foo": {"bar": 0.25, "buz": 0.6666666666666666},
 * //   "bar": {"foo": 0.25, "buz": 0.2},
 * //   "buz": {"foo": 0.6666666666666666, "bar": 0.2}
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
 */

Jaccard.prototype.wait = 0;

/**
 * Time in millisecond to expire cache. 5 minutes per default.
 *
 * @type {number}
 */

Jaccard.prototype.expire = 5 * 60 * 1000;

/**
 * Concurrency to run calculating.
 * Only single task allowed per default.
 * The other tasks will wait until the first task completed.
 * Set 0 when no throttle limitation needed.
 *
 * @type {number}
 */

Jaccard.prototype.throttle = 1;

/**
 * Timeout until receiving result. 1 minutes per default.
 *
 * @type {number}
 */

Jaccard.prototype.timeout = 60 * 1000;

/**
 * Hash function. Override this only when you need another function than JSON.stringify()
 *
 * @param id {string|Object}
 * @returns {string}
 */

Jaccard.prototype.hasher = JSON.stringify.bind(JSON);

/**
 * False when sourceId and targetId are swappable.
 * Set true when they have a direction.
 *
 * @type {boolean}
 */

Jaccard.prototype.direction = false;

/**
 * Load an array for sourceId or targetId with cached.
 *
 * @param id {string|Object}
 * @returns {Array|Promise}
 */

Jaccard.prototype.cachedList = function cachedList(id) {
  var task = this.cachedList = wrap.call(this, this.getList); // lazy build
  return task.call(this, id);
};

/**
 * Load an array for sourceId or targetId without cached.
 * Override this before started.
 *
 * @param id {string|Object}
 * @returns {Array|Promise}
 */

Jaccard.prototype.getList = function getList(id) {
  throw new Error("getList function not implemented");
};

/**
 * Calculate matrix with cached.
 *
 * @param sourceList {Array} array of source Ids
 * @param [targetList] {Array} array of target Ids
 * @returns {Object|Promise}
 */

Jaccard.prototype.cachedMatrix = function cachedMatrix(sourceList, targetList) {
  var task = this.cachedMatrix = wrap.call(this, this.getMatrix); // lazy build
  return task.call(this, sourceList, targetList);
};

/**
 * Calculate matrix without cached.
 *
 * @param sourceList {Array} array of source Ids
 * @param [targetList] {Array} array of target Ids
 * @returns {Object|Promise}
 */

Jaccard.prototype.getMatrix = function getMatrix(sourceList, targetList) {
  var that = this;
  var matrix = {};
  var wait = that.wait && promisen.wait(that.wait);
  if (!targetList) targetList = sourceList;

  return promisen.eachSeries(sourceList, sourceIt)().then(done);

  function sourceIt(sourceId) {
    var sourceKey = that.getId ? that.getId(sourceId) : sourceId;
    var row = matrix[sourceKey] || (matrix[sourceKey] = {});
    return promisen.eachSeries(targetList, targetIt)();

    function targetIt(targetId) {
      var targetKey = that.getId ? that.getId(targetId) : targetId;
      if (sourceKey === targetKey) return;

      if (!that.direction && targetId < sourceId) {
        return that.cachedScore(targetId, sourceId).then(then); // swapped
      } else {
        return that.cachedScore(sourceId, targetId).then(then);
      }

      function then(index) {
        if (index == null) return;
        row[targetKey] = that.round ? that.round(index) : index;
        return wait && wait();
      }
    }
  }

  function done() {
    return matrix;
  }
};

/**
 * Get Jaccard index between sourceId and targetId with cached.
 *
 * @param sourceId {string|Object}
 * @param targetId {string|Object}
 * @returns {Promise}
 */

Jaccard.prototype.cachedScore = function cachedScore(sourceId, targetId) {
  var task = this.cachedScore = wrap.call(this, this.getScore); // lazy build
  return task.call(this, sourceId, targetId);
};

/**
 * Get Jaccard index between sourceId and targetId without cached.
 *
 * @param sourceId {string|Object}
 * @param targetId {string|Object}
 * @returns {Promise}
 */

Jaccard.prototype.getScore = function getScore(sourceId, targetId) {
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
 * Calculate Jaccard index between a pair of Arrays.
 *
 * @param sourceLog {Array}
 * @param targetLog {Array}
 * @returns {number|undefined|Promise}
 */

Jaccard.prototype.index = function index(sourceLog, targetLog) {
  if (!sourceLog) return;
  if (!targetLog) return;

  var map = {};

  sourceLog.forEach(function(id) {
    map[id] |= 1;
  });

  targetLog.forEach(function(id) {
    map[id] |= 2;
  });

  var list = Object.keys(map);
  var OR = list.length;
  if (!OR) return;

  var AND = list.filter(isAND).length;
  return AND / OR;

  function isAND(id) {
    return map[id] === 3;
  }
};

/**
 * Stringify ID. Just pass through per default.
 *
 * @method
 * @param id {string|Object} ID string or object
 * @returns {string}
 * @example
 * jaccard.getId = function(id) {
 *   return id; // pass through
 * };
 */

Jaccard.prototype.getId = void 0;

/**
 * Return an index rounded. Do nothing per default.
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

Jaccard.prototype.round = void 0;

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
    task = promisen.memoize(task, this.expire, this.hasher);
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
