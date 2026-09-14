const express = require('express');
const auth = require('../controller/verifyAuthController');
const { restrictTo } = auth;
const AssignmentModel = require('../model/schema/assignment');
const userModel = require('../model/schema/Registeration');
const hodQuery = require("../model/query/hodDashBoardQuery")
const { remarkMail } = require('../controller/brevoMailer');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

   

const router = express.Router();



/************************************************************************************** */ 



router.get('/hodDashboard', auth, restrictTo('HOD', 'H.O.D'), async(req, res) => {
  const user = req.user;
  const hod = await userModel.findOne({ email: user.email });
  
  const students = await userModel.find({ departement: hod.departement });
  const studentIds = students.map(s => s._id);
  

  const pendingCount = await AssignmentModel.countDocuments({
    currentReviewer: hod.name,
    status: { $in: ["Forwarded", "Submitted"] }
  });

  console.log(pendingCount);

  const approvedCount = await AssignmentModel.countDocuments({
    studentId: { $in: studentIds },
    status: "Approved"
  });

  const rejectedCount = await AssignmentModel.countDocuments({
    studentId: { $in: studentIds },
    status: "Rejected"
  });

  const totalCount = await AssignmentModel.countDocuments({
    studentId: { $in: studentIds }
  });

  console.log(totalCount);
  const stats = {
    statusWise: [
      { _id: "Submitted", count: pendingCount },
      { _id: "Approved", count: approvedCount },
      { _id: "Rejected", count: rejectedCount }
    ],
    totalAssignments: [
      { total: totalCount }
    ]
  };

  const pendingAssignments = await AssignmentModel.find({ 
    currentReviewer: hod.name, 
    status: { $in: ["Forwarded", "Submitted"] } 
  });
 
  res.render("hodDashboard", { activePage: "dashboard", pendingAssignments, stats });
});


/************************************************************************************** */ 




router.get('/hod/myReview', auth, restrictTo('HOD', 'H.O.D'), async (req, res) => {

  let { page = 1, status, sort = "new", success } = req.query;
  page = Number(page);

  const limit = 5;
  const skip = (page - 1) * limit;

  const user = req.user;
  const hod = await userModel.findOne({ email: user.email });

  const students = await userModel.find({ departement: hod.departement });
  const studentIds = students.map(s => s._id);

  let filter = {};
  if (status === "Forwarded") {
    filter = { currentReviewer: hod.name, status: { $in: ["Forwarded", "Submitted"] } };
  } else if (status === "Approved") {
    filter = { studentId: { $in: studentIds }, status: "Approved", approvedBy: "HOD" };
  } else if (status === "Rejected") {
    filter = { studentId: { $in: studentIds }, status: "Rejected", rejectedBy: "HOD" };
  } else {
    filter = {
      $or: [
        { currentReviewer: hod.name },
        { studentId: { $in: studentIds }, approvedBy: "HOD" },
        { studentId: { $in: studentIds }, rejectedBy: "HOD" }
      ]
    };
  }

  let sortQuery = { submittedAt: sort === "new" ? -1 : 1 };

  const assignments = await AssignmentModel
    .find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit);

    console.log(assignments);

  const totalAssignments = await AssignmentModel.countDocuments(filter);
  const pages = Math.ceil(totalAssignments / limit);

  res.render("HodReview", {
    activePage: "reviews",
    assignments,
    pages,
    currentPage: page,
    status: status || "",
    sort,
    success: success || ""
  });
});


/************************************************************************************** */ 


router.get('/hod/review/:id', auth, restrictTo('HOD', 'H.O.D'), async (req, res) => {
  const id = req.params.id;
  const assignment = await AssignmentModel.findById(id);
  const student = await userModel.findById(assignment.studentId);
  const user = await userModel.findOne({ email: req.user.email });
  console.log("Assignment Details for HOD:", student);
  res.render("ProffesorReview", { activePage: "reviews", assignment, student, user, error: null });
});



/************************************************************************************** */ 



router.get('/hod/profile', auth, restrictTo('HOD', 'H.O.D'), async (req, res) => {
  const userDetail = req.user;
  const user = await userModel.findOne({ email: userDetail.email });
  console.log("User Details:", user);
  res.render("hodProfile", { activePage: "profile", user });
});



/************************************************************************************** */ 



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("application/pdf")) {
      const uploadpath = path.join(__dirname, "..", 'signature', 'uploads')
      console.log("upload path :", uploadpath)
      fs.mkdirSync(uploadpath, { recursive: true })
      cb(null, uploadpath)
    }
    else {
      return cb(new Error('Only image or PDF files are allowed!'));
    }
  },
  filename: (req, file, cb) => {
    let name = Date.now() + "-" + file.originalname
    cb(null, name)
  }
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("application/pdf")) {
      cb(null, true)
    } else {
      cb(new Error('Only pdf files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});


/************************************************************************************** */ 




router.post('/hod/review/submit/:id', auth, restrictTo('HOD', 'H.O.D'), (req, res) => {
  upload.single("signature")(req, res, async function (err) {
    const assignmentId = req.params.id;
    const userDetail = req.user;
    const user = await userModel.findOne({ email: userDetail.email });
    const assign = await AssignmentModel.findById(assignmentId);
    const student = await userModel.findById(assign.studentId);

    if (err) {
      return res.render("ProffesorReview", {
        activePage: "reviews",
        assignment: assign,
        student,
        user,
        error: err.message
      });
    }

    if (!req.file) {
      return res.render("ProffesorReview", {
        activePage: "reviews",
        assignment: assign,
        student,
        user,
        error: "Signature file is required for both approving and rejecting assignments."
      });
    }

    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'Proessor_Signatures',
        resource_type: 'raw',
        filename_override: req.file.originalname,
        use_filename: true,
        unique_filename: false
      });

      const signature_url = result.secure_url;

      if (req.body.action === "approve") {
        remarkMail("HOD", req.body.remarks, student.email, "Approved", assign.category, assign.title);
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          signature_url,
          approvedBy: "HOD",
          rejectedBy: null,
          status: "Approved",
          currentReviewer: null,
          remark: req.body.remarks
        });
      } else {
        remarkMail("HOD", req.body.remarks, student.email, "Rejected", assign.category, assign.title);
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          signature_url,
          rejectedBy: "HOD",
          approvedBy: null,
          status: "Rejected",
          currentReviewer: null,
          remark: req.body.remarks
        });
      }

      res.redirect('/hod/myReview?success=true');
    } catch (uploadErr) {
      console.error("Cloudinary upload/DB update error:", uploadErr);
      return res.render("ProffesorReview", {
        activePage: "reviews",
        assignment: assign,
        student,
        user,
        error: "An error occurred while uploading the signature: " + uploadErr.message
      });
    } finally {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err && err.code !== 'ENOENT') console.error("Error deleting temp signature file:", err);
        });
      }
    }
  });
});

module.exports = router;