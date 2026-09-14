const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    phone:{
        type:Number,
       // unique:true,
        maxlength:10
    },
    departement:{
        type:String
    },
    role:{
        type:String
    }
})

// Compound partial unique index to allow only one HOD per department
userSchema.index(
    { departement: 1 },
    { 
        unique: true, 
        partialFilterExpression: { role: 'HOD' } 
    }
);

const userModel = mongoose.model("User",userSchema);

module.exports = userModel;