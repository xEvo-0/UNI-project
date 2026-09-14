const departmentModel = require("../schema/Department");

async function  getDepartmentNames() {
  const departments = await departmentModel.find({}, { departmentName: 1, _id: 0 });
  return departments;
}

module.exports = getDepartmentNames;
