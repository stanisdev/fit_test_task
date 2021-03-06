'use strict';

const conform = require('conform');
const json2csv = require('json2csv');
const fs = require('fs');
const strategy = {};

/**
 * Export data as CSV
 */
strategy.export = (docs, body, res, exportDir) => {
  return new Promise((resolve, reject) => {

    const delimiter = body.delimiter || ',';
    const fields = Object.keys(docs[0]);
    const csv = json2csv({
      data: docs,
      fields: fields,
      del: delimiter
    });
    const filePath = `${exportDir}/file.csv`;
    fs.writeFile(filePath, csv, function(error) {
      if (error) {
        return reject(error);
      }
      resolve({
        fileName: 'file.csv',
        filePath: filePath
      });
    });
  });
};

module.exports = strategy;
