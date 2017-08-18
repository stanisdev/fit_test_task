const express = require("express");
const glob = require("glob");
const config = require(__dirname + "/config");
const nunjucks = require("nunjucks");
const path = require('path');
const app_port = process.env.PORT || config.app.port;

const app = express();

app.set("config", config);

// Views setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "nunjucks");
app.use(express.static(path.join(__dirname, 'public')));

const nunjucks_config = {
  autoescape: true,
  noCache: true,
  express: app
};
nunjucks.configure(path.join(__dirname, "views"), nunjucks_config);

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
