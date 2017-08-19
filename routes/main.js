const conform = require("conform");
const request = require("request");
const Bluebird = require("bluebird");
const json2csv = require("json2csv");
const fs = require("fs");

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
    const auxServices = app.get("services").intermedium.loadAuxiliaryServices(app.get("config"));

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

  /**
   * Describe me
   */
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
      }).catch(app.get("services").intermedium.printError.bind(null, res));
    });
  });

  /**
   * Describe me
   */
  app.post("/transform-data-1", (req, res) => {
    const field = req.body.sorting_field;
    const order = req.body.sorting_order;

    const sorting = {};
    sorting[field] = order == "asc" ? 1 : -1;
    const collection = app.get("db").connection.collection("parsed_data");
    collection.find(null, {
      id: 1,
      title: 1,
      created: 1,
      score: 1
    }).sort(sorting).toArray(function(error, docs) {
      if (error) {
        console.log(error);
        return res.send("Ошибка во время обращения к БД");
      }
      app.get("services").intermedium.saveTransformedData(app, res, docs).then(() => {
        res.redirect("/task-1-2/treatment");
      }).catch(app.get("services").intermedium.printError.bind(null, res));
    });
  });

  /**
   * Describe me
   */
  app.post("/transform-data-2", (req, res) => {
    const order = req.body.sorting_order;

    const sorting = {
      total_count: order == "asc" ? 1 : -1
    };
    const collection = app.get("db").connection.collection("parsed_data");
    collection.aggregate([
      {
        $group: {
          _id: "$domain",
          total_count: { $sum: 1 },
          score_sum: { $sum: "$score" }
        }
      },
      {
        $sort: sorting
      },
      {
        $project: {
          domain: "$_id",
          total_count: 1,
          score_sum: 1,
          _id: 0
        }
      }
    ]).toArray(function(error, docs) {
      if (error) {
        console.log(error);
        return res.send("Ошибка во время обращения к БД");
      }
      app.get("services").intermedium.saveTransformedData(app, res, docs).then(() => {
        res.redirect("/task-1-2/treatment");
      }).catch(app.get("services").intermedium.printError.bind(null, res));
    });
  });

  /**
   * Describe me
   */
  app.get("/task-1-2/treatment", (req, res) => {
    res.render("main/treatment.html", {
      body_title: "Задание 3 :: Преобразование информации",
      page_header: "Экспорт"
    });
  });

  /**
   * Describe me
   */
  app.post("/get_csv", (req, res) => {

    const collection = app.get("db").connection.collection("transformed_data");
    collection.find({}, {_id: 0}).toArray(function(error, docs) {
      if (error) {
        console.log(error);
        return res.send("Ошибка во время выборки данных из БД");
      }
      if (!Array.isArray(docs) || docs.length < 1) {
        return res.json("Данные не подлежат экспорту");
      }
      const fields = Object.keys(docs[0]);
      var csv = json2csv({
        data: docs,
        fields: fields,
        del: ","
      });
      const filePath = app.get("config").root_dir + "/file.csv";
      fs.writeFile(filePath, csv, function(error) {
        if (error) {
          console.log(error);
          return res.send("Невозможно сохранить данные в файл");
        }
        res.setHeader("Content-disposition", "attachment; filename=output.csv");
        res.setHeader("Content-type", "text/plain");
        const filestream = fs.createReadStream(filePath);
        filestream.pipe(res);
      });
    });
  });
};
