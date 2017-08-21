const fs = require("fs");
const strategy = {};

/**
 * Export data as SQL
 */
strategy.export = (docs, body, res, exportDir) => {
  return new Promise((resolve, reject) => {

    const tableName = body.table_name;
    let sql = `
DROP TABLE IF EXISTS ${tableName};

CREATE TABLE ${tableName} (
  safe_id int unsigned not null primary key auto_increment,
`;
    const tableFilds = Object.keys(docs[0]);
    tableFilds.forEach(fieldName => {
      switch (typeof docs[0][fieldName]) {
        case "number":
          sql += `  ${fieldName} int not null, \n`;
          break;
        case "string":
          sql += `  ${fieldName} varchar(255) not null, \n`;
          break;
        case "boolean":
          sql += `  ${fieldName} tinyint(1) not null, \n`;
          break;
        default:
          sql += `  ${fieldName} tinyint(1) not null, \n`;
      }
    });
    sql = sql.slice(
      0, sql.lastIndexOf(",")
    );
    sql += "\n) CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE=INNODB;\n\n"
    sql += `INSERT INTO ${tableName} (`;
    sql += tableFilds.map(e => `\`${e}\``).join(", ") + ")\n VALUES\n";

    docs.forEach(doc => {
      if (!(doc instanceof Object)) {
        return;
      }
      sql += "(";
      for (let fieldName in doc) {
        let value = doc[fieldName];
        sql += typeof value == "string" ? `"${value}", ` : `${value}, `;
      }
      sql = sql.slice(0, -2);
      sql += "),\n";
    });
    sql = sql.slice(0, sql.lastIndexOf(",")) + ";";

    const filePath = `${exportDir}/file.sql`;
    fs.writeFile(filePath, sql, function(error) {
      if (error) {
        return reject(error);
      }
      resolve({
        fileName: "file.sql",
        filePath: filePath
      });
    });
  });
};

module.exports = strategy;
