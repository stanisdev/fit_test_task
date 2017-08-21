const way = {};

/**
 * Transform data by aggregation
 */
way.transform = (app, body) => {
  return new Promise((resolve, reject) => {

    const order = body.sorting_order;
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
        reject(error);
      }
      resolve(docs);
    });
  });
};

module.exports = way;
