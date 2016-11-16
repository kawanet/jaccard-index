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

function filename(file) {
  return file.replace(/^.*\//, "");
}

function round(index) {
  return Math.round(index * 1000) / 1000;
}

function linksToTable(links) {
  var header = [""];
  var table = [header];
  var rows = {};
  var cols = {};

  links.forEach(function(link) {
    add(link.source, link.target, link.value);
    add(link.target, link.source, link.value);
  });

  function add(source, target, value) {
    var row = rows[source];
    if (!row) {
      row = rows[source] = [filename(source)];
      table.push(row);
    }
    var col = cols[target];
    if (!col) {
      col = cols[target] = header.length;
      header.push(filename(target));
    }
    row[col] = value;
  }

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

  if (!args.length) {
    var cmd = process.argv[1].split("/").pop();
    console.warn("Usage: " + cmd + " [--csv] item1.txt item2.txt item3.txt...");
    process.exit(1);
  }

  var jaccard = new Jaccard();
  jaccard.expire = 1000;
  jaccard.getLog = getLog;
  jaccard.filter = round;

  var job = jaccard.getLinks(args, null);

  if (csv) {
    job = job.then(function(links) {
      return tableToCSV(linksToTable(links));
    });
  } else {
    job = job.then(function(links) {
      return JSON.stringify(links, null, 2);
    });
  }

  return job.then(show).then(process.exit); // kill self
}

function show(data) {
  process.stdout.write(data);
}

function fatal(reason) {
  console.warn(reason && reason.stack || reason);
}

CLI().catch(fatal);
