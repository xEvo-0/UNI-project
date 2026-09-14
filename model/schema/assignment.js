const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedBy: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    filename:{
        type: [String],
    },
    status: {
        type: String,
        default: "Draft"
    },
    approvedBy:{
        type:String,
        default: null
    },
    rejectedBy:{
        type:String,
        default: null
    },
    remark:{
        type:String,
        default:null
    },
    currentReviewer: {
        type: String,
        default: null
    },
    download_url:{
        type:  [String] 
    },
    preview_url: {
        type:  [String]
    },
    signature_url:{
        type: String,
        default: null
    },
    professorName: {
        type: String,
        default: null
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }  
}, { timestamps: true });

const AssignmentModel = mongoose.model("assignments", assignmentSchema);

module.exports = AssignmentModel;
