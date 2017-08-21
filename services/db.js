'use strict';

const MongoClient = require('mongodb').MongoClient;
const Bluebird = require('bluebird');
const db = {};

/**
 * Meaning to run program lives here
 */
db.connect = (config) => {
  return new Promise((resolve, reject) => {

    const url = `mongodb://localhost:${config.db.port}/${config.db.name}`;
    Bluebird.promisify(MongoClient.connect)(url).then(connection => {
      console.log('DB connected successfully');
      db.connection = connection;
      resolve(db);
    }).catch(reject);
  });
};

/**
 * Sending query and painless error handler
 */
db.query = function(args) {
  return new Promise((resolve, reject) => {
    this.connection.collection(args.collection)[args.query](args.data, function(error, docs) {
      if (error) {
        return reject(error);
      }
      resolve(docs);
    });
  });
};

module.exports = db;
