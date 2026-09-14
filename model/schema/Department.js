const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    departmentName: {
        type: String,
        unique: true,
    },
    programmeType: {
        type: String,
    },
    address: {
        type: String,
    }
})

const DepartmentModel = mongoose.model("departments",departmentSchema);

module.exports = DepartmentModel;