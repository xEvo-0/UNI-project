const mongoose = require("mongoose");
const AssignmentModel = require("../schema/assignment");

async function getAssignmentStatus(studentId) {
  if (!studentId) return [];
  const data = await AssignmentModel.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $group: {
        _id: "$status",
        countAssignments: { $sum: 1 }
      }
    }
  ]);
  return data;
}

module.exports = getAssignmentStatus;
