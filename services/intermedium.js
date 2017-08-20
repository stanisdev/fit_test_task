const service = {};
const glob = require("glob");
const path = require("path");
const async = require("async");
const nunjucks = require("nunjucks");
const fs = require("fs");

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
      pathDir: element,
      dirName: path.basename(element)
    }
  });
  return result;
};

/**
 * Describe me
 */
service.loadHtmlRepresentations = function(config, entityName, entityDescription) {
  return new Promise((resolve, reject) => {

    const pathes = this.getPathes(config, entityName);
    async.map(pathes, (path, next) => {
      const pathToHtml = `${path.pathDir}/html/representation.html`;
      fs.readFile(pathToHtml, (error, data) => {
        if (error) {
          console.log(error);
          return reject(`Html-представление способа ${entityDescription} данных "${path.dirName}" не найдено`);
        }
        const html = data.toString();
        const template = nunjucks.compile(html);
        const config = require(`${path.pathDir}/config.json`)
        const templateData = config instanceof Object && "html" in config ? config.html : {};
        path.html = template.render(templateData);
        path.config = config;
        next(null, path);
      });
    }, (err, output) => {
      resolve(output);
    });
  });
};

/**
 * Describe me
 */
service.loadAuxiliaryServices = function(config) {
  const services = {};
  ["transformation_ways", "export_strategies"].forEach(entity => {
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
