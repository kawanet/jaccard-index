#!/usr/bin/env node

/* jshint eqnull:true */

var fs = require("fs");
var Jaccard = require("../");

function getLog(file) {
  // return new Promise(then); // Promise
  return {then: then}; // Thenable

  function then(resolve, reject) {
    fs.readFile(file, "utf-8", function(err, text) {
      if (err) return reject(err);
      var data = text.split("\n").filter(isTrue);
      return resolve(data);
    });
  }
}

function isTrue(v) {
  return !!v;
}

function getId(file) {
  return file.replace(/^.*\//, "");
}

function round(index) {
  return Math.round(index * 1000) / 1000;
}

function matrixToTable(matrix) {
  var columns = Object.keys(matrix);
  var table = columns.map(function(rowId) {
    var row = matrix[rowId];
    var record = row ? columns.map(function(colId) {
      return row[colId];
    }) : [];
    record.unshift(rowId);
    return record;
  });
  columns.unshift("");
  table.unshift(columns);
  return table;
}

function tableToCSV(table) {
  return table.map(function(row) {
      return row.map(escapeCSV).join(",");
    }).join("\n") + "\n";
}

function escapeCSV(str) {
  if (str == null) return "";
  if ("string" !== typeof str) str += "";
  return str.replace(/[\s,"\\]+/g, " ");
}

function CLI() {
  var args = Array.prototype.slice.call(process.argv, 2);
  var csv = (args[0] === "--csv") && args.shift();
  var stream = (args[0] === "--stream") && args.shift() && process.stdout;

  if (!args.length) {
    var cmd = process.argv[1].split("/").pop();
    console.warn("Usage: " + cmd + " [--csv] [--stream] item1.txt item2.txt item3.txt...");
    process.exit(1);
  }

  var jaccard = new Jaccard();
  jaccard.expire = 1000;
  jaccard.getLog = getLog;
  jaccard.getId = getId;
  jaccard.round = round;

  if (stream) {
    jaccard.filter = function(index, source, target) {
      return [source, target, index].join(",") + "\n";
    };
  }

  var job = jaccard.getMatrix(args, null, stream);

  if (!stream) {
    if (csv) {
      job = job.then(function(matrix) {
        return tableToCSV(matrixToTable(matrix));
      });
    } else {
      job = job.then(function(matrix) {
        return JSON.stringify(matrix, null, 2);
      });
    }
    job = job.then(function(data) {
      process.stdout.write(data);
    });
  }

  return job.then(process.exit); // kill self
}

function fatal(reason) {
  console.warn(reason && reason.stack || reason);
}

CLI().catch(fatal);
