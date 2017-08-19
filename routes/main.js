const conform = require("conform");
const request = require("request");
const Bluebird = require("bluebird");

/**
 * Main actions
 */
module.exports = (app) => {

  /**
   * Index page
   */
  app.get("/", (req, res) => {
    res.render("main/index.html", {
      body_title: "Главная страница",
      page_header: "Добро пожаловать."
    });
  });

  /**
   * Task first and second
   */
  app.get("/task-1-2", (req, res) => {
    const auxServices = app.get("services").other.loadAuxiliaryServices(app.get("config"));

    res.render("main/task-1-2.html", {
      body_title: "Задание 1 и 2",
      page_header: "Обработка данных с reddit"
    });
  });

  /**
   * Third task
   */
  app.get("/task-3", (req, res) => {
    res.render("main/task-3.html", {
      body_title: "Задание 3",
      page_header: "Преобразование массива"
    });
  });

  app.post("/load-json-from-reddit", (req, res) => {
    const checking = conform.validate(req.body, {
      properties: {
        url: {
          description: "Поле для ввода URL",
          type: "string",
          required: true,
          format: "url",
          message: "Введите корректный URL"
        }
      }
    });
    if (!(checking instanceof Object) || !checking.valid) {
      return res.render("main/task-1-2.html", {
        body_title: "Задание 1 и 2",
        page_header: "Обработка данных с reddit",
        errors: checking.errors
      });
    }
    request(req.body.url, function(error, response, body) {
      if (error) {
        return res.send("Ошибка во время получения данных по указанному URL");
      }
      try {
        var jsonedData = JSON.parse(body).data.children;
        jsonedData = jsonedData.map(element => element.data);
      } catch (e) {
        console.log(e);
        return res.send("Полученные данные некорректны");
      }
      app.get("services").db.query({
        collection: "parsed_data",
        query: "insertMany",
        data: jsonedData
      }).then(docs => {
        res.redirect("back");
      }).catch(app.get("services").other.printError.bind(null, res));
    });
  });
};
