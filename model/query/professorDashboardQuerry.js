const AssignmentModel = require("../schema/assignment");

async function getAssignmentStats(professor) {
  const stats = await AssignmentModel.aggregate([
    { $match: { currentReviewer: professor } },

    {
      $facet: {
        statusWise: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ],
        totalAssignments: [
          { $count: "total" }
        ]
      }
    }
  ]);

  return stats[0];
}

module.exports = getAssignmentStats;

