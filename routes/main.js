'use strict';

const conform = require('conform');
const request = require('request');
const Bluebird = require('bluebird');
const nunjucks = require('nunjucks');
const _ = require('lodash');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

/**
 * Main actions
 */
module.exports = (app) => {

  /**
   * Index page
   */
  app.get('/', (req, res) => {
    res.render('main/index.html', {
      body_title: 'Главная страница',
      page_header: 'Добро пожаловать.'
    });
  });

  /**
   * Task first and second
   */
  app.get('/task-1-2', (req, res) => {
    const collection = app.get('db').connection.collection('parsed_data');
    collection.find({}).limit(1).toArray(function(error, docs) {
      if (error) {
        console.log(error);
        return res.send('Ошибка во время выборки данных из БД');
      }
      const renderInfo = {
        body_title: 'Задание 1 и 2',
        page_header: 'Обработка данных с reddit',
      };
      if (!Array.isArray(docs) || docs.length < 1) { // Parsed_data collection is empty
        return res.render('main/task-1-2.html', Object.assign(renderInfo, {
          initial_running: true
        }));
      }
      // Load html-representation's all transformation ways
      app.get('services').intermedium.loadHtmlRepresentations(app.get('config'), 'transformation_ways', 'обработки').then(ways => {
        res.render('main/task-1-2.html', Object.assign(renderInfo, {
          ways: ways
        }));
      }).catch(error => {
        console.log(error);
        let message = typeof error == 'string' ? error : 'Непредвиденная ошибка';
        res.send(message);
      });
    });
  });

  /**
   * Third task
   */
  app.get('/task-3', (req, res) => {
    res.render('main/task-3.html', {
      body_title: 'Задание 3',
      page_header: 'Преобразование массива'
    });
  });

  /**
   * Load json from reddit and parse it
   */
  app.post('/load-json-from-reddit', (req, res) => {
    const checking = conform.validate(req.body, {
      properties: {
        url: {
          description: 'Поле для ввода URL',
          type: 'string',
          required: true,
          format: 'url',
          message: 'Введите корректный URL'
        }
      }
    });
    if (!(checking instanceof Object) || !checking.valid) {
      return res.render('main/task-1-2.html', {
        body_title: 'Задание 1 и 2',
        page_header: 'Обработка данных с reddit',
        errors: checking.errors
      });
    }
    request(req.body.url, function(error, response, body) {
      if (error) {
        return res.send('Ошибка во время получения данных по указанному URL');
      }
      try {
        var jsonedData = JSON.parse(body).data.children;
        jsonedData = jsonedData.map(element => element.data);
      } catch (e) {
        console.log(e);
        return res.send('Полученные данные некорректны');
      }
      app.get('services').db.query({
        collection: 'parsed_data',
        query: 'insertMany',
        data: jsonedData
      }).then(docs => {
        res.redirect('/task-1-2');
      }).catch(app.get('services').intermedium.printError.bind(null, res));
    });
  });

  /**
   * Transform data by specified way
   */
  app.post('/transform-data', (req, res) => {
    const wayType = req.query.way;
    const errorHandler = app.get('services').intermedium.printError.bind(null, res);
    const wayPath = app.get('config').root_dir + `/services/transformation_ways/${wayType}/way.js`;

    fs.stat(wayPath, (error, stat) => {
      if (error || !(stat instanceof Object)) {
        console.log(error);
        return res.send('Способ обработки данных не найден');
      }
      // Way exists, include and use it
      const way = require(wayPath);
      way.transform(app, req.body).then(docs => {

        // Save recieved docs
        app.get('services').intermedium.saveTransformedData(app, res, docs).then(() => {
          res.redirect('/task-1-2/treatment');
        }).catch(errorHandler);
      }).catch(errorHandler);
    });
  });

  /**
   * Show form to use necessary export strategy
   */
  app.get('/task-1-2/treatment', (req, res) => {
    app.get('services').intermedium.loadHtmlRepresentations(app.get('config'), 'export_strategies', 'экспорта').then(strategies => {
      res.render('main/treatment.html', {
        body_title: 'Задание 1, 2 :: Экспорт данных',
        page_header: 'Экспорт',
        strategies: strategies
      });
    }).catch(error => {
      console.log(error);
      let message = typeof error == 'string' ? error : 'Непредвиденная ошибка';
      res.send(message);
    });
  });

  /**
   * Export data by downloading it
   */
  app.post('/export-data', (req, res) => {
    const strategyType = req.query.strategy;
    const strategyPath = app.get('config').root_dir + `/services/export_strategies/${strategyType}/strategy.js`;

    fs.stat(strategyPath, (error, stat) => {
      if (error || !(stat instanceof Object)) {
        console.log(error);
        return res.send('Способ экспорта данных не найден');
      }
      const strategy = require(strategyPath);

      // Retrieve data
      const collection = app.get('db').connection.collection('transformed_data');
      collection.find({}, {_id: 0}).toArray(function(error, docs) {
        if (error) {
          console.log(error);
          return res.send('Ошибка во время выборки данных из БД');
        }
        if (!Array.isArray(docs) || docs.length < 1) {
          return res.send('Данные не подлежат экспорту');
        }
        fs.stat(app.get('config').tmp_dir, (error, stat) => { // Check tmp folder existence

          (new Promise((resolve, reject) => {
            if (error) { // If folder does not exist, create it
              fs.mkdir(app.get('config').tmp_dir, (error, response) => {
                if (error) {
                  return reject();
                }
                resolve();
              });
            } else {
              resolve();
            }
          })).then(() => {
            // To validate post-fields
            const config = require(path.dirname(strategyPath) + '/config.json');
            if (config instanceof Object && 'validation_fields' in config) {
              const checking = conform.validate(req.body, {
                properties: Object.assign({}, config.validation_fields)
              });
              if (!(checking instanceof Object) || !checking.valid) {
                return app.get('services').intermedium.loadHtmlRepresentations(app.get('config'), 'export_strategies', 'экспорта').then(strategies => {
                  res.render('main/treatment.html', {
                    body_title: 'Задание 1, 2 :: Экспорт данных',
                    page_header: 'Экспорт',
                    strategies: strategies,
                    errors: checking.errors
                  });
                }).catch(error => {
                  console.log(error);
                  let message = typeof error == 'string' ? error : 'Непредвиденная ошибка';
                  res.send(message);
                });
              }
            }
            // Execute export strategy
            strategy.export(docs, req.body, res, app.get('config').tmp_dir).then(data => {

              // Download file
              res.setHeader('Content-disposition', `attachment; filename=${data.fileName}`);
              res.setHeader('Content-type', 'text/plain');
              const filestream = fs.createReadStream(data.filePath);
              filestream.pipe(res);
            }).catch(error => {
              console.log(error);
              res.send('Ошибка во время экспорта');
            });
          }).catch(error => {
            console.log(error);
            res.send('Непредвиденная ошибка')
          });
        });
      });
    });
  });

  /**
   * Transform array to dendritic representation
   */
  app.post('/transform-array', (req, res) => {
    const checking = conform.validate(req.body, {
      properties: {
        array: {
          description: 'Поле для ввода массива',
          type: 'string',
          required: true,
          message: 'Укажите массива для преобразования'
        }
      }
    });
    if (!(checking instanceof Object) || !checking.valid) {
      return res.render('main/task-3.html', {
        body_title: 'Задание 3',
        page_header: 'Преобразование массива',
        errors: checking.errors
      });
    }
    try {
      var arr = req.body.array.replace(/[\t\n\s]/g, '');
      arr = JSON.parse(arr);
    } catch (err) {
      console.log(err);
      return res.json('Переданный массив не корректен');
    }
    var result = [];

    // 1. Найти наименьшие id родителей, которых не существуют в массиве
    const noParent = arr.filter(e => {
      return !_.find(arr, a => a.id == e.parentId);
    });

    // 2. Удалить их
    arr = arr.filter(e => {
      return !_.find(noParent, a => a.id == e.id);
    });

    // Начинаем обходить с первых детей и вглубь
    noParent.forEach(e => {
      findChildren(e);
      result.push(e);
    });

    function findChildren(parent) {
      if (arr.length < 1) {
        return;
      }
      let children = arr.filter(e => {
        return parent.id == e.parentId;
      });
      if (children.length > 0) { // Дети найдены
        parent.children = children;
        children.forEach(child => { // Удалим найденых детей из основного массива
          arr = arr.filter(e => {
            return e.id != child.id;
          });
        });
        parent.children.forEach(e => {
          findChildren(e); // Призываем на помощь рекурсию
        });
      }
    }
    res.json(result);
  });
};
