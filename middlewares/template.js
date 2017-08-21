'use strict';

/**
 * Just useful middleware for handy access to necessary data from templates
 */
module.exports = (app) => {
  app.use(function(req, res, next) {
    app.locals.url = req.url;
    next();
  });
};
