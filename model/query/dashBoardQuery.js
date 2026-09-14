const userModel = require("../schema/Registeration");
const departmentModel = require("../schema/Department")

async function getUserStats() {
  const data = await userModel.aggregate([
    {
      $group: {
        _id: "$role",
        countUsers: { $sum: 1 }
      }
    }
  ]);
  return data;
}

async function getDepartmentCount() {
  const departments = await departmentModel.aggregate([
    {
      $count: "totalDepartments"
    }
  ]);
  return departments;
}

module.exports = { getUserStats ,getDepartmentCount};
