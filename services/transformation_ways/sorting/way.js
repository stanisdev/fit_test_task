const moment = require("moment");
const way = {};

/**
 * Put some describing here
 */
way.transform = (app, body) => {
  return new Promise((resolve, reject) => {

    const field = body.sorting_field;
    const order = body.sorting_order;

    const sorting = {};
    sorting[field] = order == "asc" ? 1 : -1;
    const collection = app.get("db").connection.collection("parsed_data");
    collection.find(null, {
      id: 1,
      title: 1,
      created: 1,
      score: 1
    }).sort(sorting).toArray(function(error, docs) {
      docs = docs.map(doc => {
        if ("created" in doc) {
          doc.created = moment(+(doc.created.toString() + "000")).format("D.MM.YYYY HH:mm:SS");
        }
        return doc;
      });
      if (error) {
        return reject(error);
      }
      resolve(docs);
    });
  });
};

module.exports = way;
