'use strict';

const express = require("express");
const glob = require("glob");
const config = require(__dirname + "/config");
const body_parser = require('body-parser');
const nunjucks = require("nunjucks");
const path = require('path');
const app_port = process.env.PORT || config.app.port;
const app = express();

app.set("config", config);

// Include main services
const services_path = glob.sync(config.root_dir + "/services/*.js");
let services = {};
services_path.forEach(s_path => {
  let service = require(s_path);
  let name = path.basename(s_path).slice(0, -path.extname(s_path).length);
  services[name] = service;
});
app.set("services", services);

// Connect to DB
app.get("services").db.connect(config).then(db => {

  app.set("db", db);
  // Views setup
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "nunjucks");
  app.use(express.static(path.join(__dirname, "public")));

  app.use(body_parser.json());
  app.use(body_parser.urlencoded({
    extended: true
  }));

  const nunjucks_config = {
    autoescape: true,
    noCache: true,
    express: app
  };
  nunjucks.configure(path.join(__dirname, "views"), nunjucks_config);

  // Middlewares
  const md_handlers = glob.sync(config.root_dir + "/middlewares/*.js");
  md_handlers.forEach(md_path => {
      require(md_path)(app);
  });

  // Load routes
  const routes = glob.sync(config.root_dir + "/routes/*.js");
  routes.forEach(route => {
    require(route)(app);
  });

  app.use((req, res, next) => {
    res.status(404).send("Page not found :(");
  });

  // Catch and print error
  if (app.get("env") === "development") {
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render("error.html", {
        message: err.message,
        error: err,
        title: "Error"
      });
    });
  }
  // Start
  app.listen(app_port, () => {
    console.log("Application are listening on port " + app_port);
  });
}).catch(err => {
  console.log("Error while connect to DB. Program has not been run.");
  console.log(err);
});
