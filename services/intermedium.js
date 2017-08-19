const service = {};
const glob = require("glob");
const path = require("path");

/**
 * Describe me
 */
service.printError = (res, err) => {
  res.send("Ошибка во время запроса в БД");
  console.log(err);
};

/**
 * Describe me
 */
service.getPathes = (config, folderPath) => {
  const pathes = glob.sync(config.root_dir + `/services/${folderPath}/*`);
  const result = pathes.map(element => {
    return {
      path: element,
      folderName: path.basename(element)
    }
  });
  return result;
};

/**
 * Describe me
 */
service.loadAuxiliaryServices = function(config) {
  const services = {};
  ["transformation_ways", "treatment_strategies"].forEach(entity => {
    let pathes = this.getPathes(config, entity);
    services[entity] = pathes;
  });
  return services;
};

/**
 * Describe me
 */
service.saveTransformedData = (app, res, data) => {
  return new Promise(function(resolve, reject) {

    const db = app.get("services").db;
    db.query({
      collection: "transformed_data",
      query: "remove",
      data: {}
    }).then(function() {

      db.query({
        collection: "transformed_data",
        query: "insertMany",
        data: data
      }).then(resolve).catch(reject);
    }).catch(reject);
  });
};

module.exports = service;
