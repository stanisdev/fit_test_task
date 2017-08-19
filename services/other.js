const service = {};
const glob = require("glob");
const path = require("path");

service.printError = (res, err) => {
  res.send("Ошибка во время запроса в БД");
  console.log(err);
};

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

service.loadAuxiliaryServices = function(config) {
  const services = {};
  ["transformation_ways", "treatment_strategies"].forEach(entity => {
    let pathes = this.getPathes(config, entity);
    services[entity] = pathes;
  });
  return services;
};

module.exports = service;
