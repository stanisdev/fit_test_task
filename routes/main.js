
/**
 * Main actions
 */
module.exports = (app) => {

  /**
   * Index page
   */
  app.get("/", (req, res) => {
    res.render("main/index.html", {});
  });
};
