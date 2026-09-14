const express = require('express');
const auth = require('../controller/verifyAuthController');
const { restrictTo } = auth;
const AssignmentModel = require('../model/schema/assignment');
const userModel = require('../model/schema/Registeration');
const professorQuerry = require("../model/query/professorDashboardQuerry")
const {otpMail,remarkMail} = require('../controller/brevoMailer')
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



/************************************************************************************** */ 


router.get('/professorDashboard', auth, restrictTo('Professor'), async (req, res) => {
  const user = req.user;
  const professor = await userModel.findOne({ email: user.email });

  const pendingCount = await AssignmentModel.countDocuments({
    currentReviewer: professor.name,
    status: "Submitted"
  });

  const approvedCount = await AssignmentModel.countDocuments({
    professorName: professor.name,
    status: { $in: ["Forwarded", "Approved"] }
  });

  const rejectedCount = await AssignmentModel.countDocuments({
    professorName: professor.name,
    status: "Rejected"
  });

  const totalCount = await AssignmentModel.countDocuments({
    professorName: professor.name
  });

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

  const pendingAssignments = await AssignmentModel.find({ status: "Submitted", currentReviewer: professor.name });
  res.render("professorDashboard", { activePage: "dashboard", pendingAssignments, stats });
});



/************************************************************************************** */ 



// router.get('/professor/myReview',auth, async(req, res) => {
//    const assignments  = await AssignmentModel.find();
//    let pages = 0;
//   res.render("myReview", { activePage: "reviews",assignments,pages });
// });


/************************************************************************************** */ 



router.get('/professor/myReview', auth, restrictTo('Professor'), async (req, res) => {

  let { page = 1, status, sort = "new", success } = req.query;
  page = Number(page);

  const limit = 5;
  const skip = (page - 1) * limit;

  const user = req.user;
  const professor = await userModel.findOne({ email: user.email });

  let filter = {};
  if (status === "Submitted") {
    filter = { professorName: professor.name, status: "Submitted" };
  } else if (status === "Approved") {
    filter = { professorName: professor.name, status: { $in: ["Forwarded", "Approved"] } };
  } else if (status === "Rejected") {
    filter = { professorName: professor.name, status: "Rejected" };
  } else {
    filter = { professorName: professor.name };
  }

  let sortQuery = { submittedAt: sort === "new" ? -1 : 1 };

  const assignments = await AssignmentModel
    .find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit);

  const totalAssignments = await AssignmentModel.countDocuments(filter);
  const pages = Math.ceil(totalAssignments / limit);

  res.render("myReview", {
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




router.get('/professor/profile', auth, restrictTo('Professor'), async (req, res) => {
  try {
    const userDetail = req.user;
    const user = await userModel.findOne({ email: userDetail.email });
    
    const statsData = await professorQuerry(user.name);
    
    let submitted = 0;
    let approved = 0;
    let rejected = 0;
    
    if (statsData && statsData.statusWise) {
      statsData.statusWise.forEach(status => {
        if (status._id === "Submitted") submitted = status.count;
        else if (status._id === "Approved") approved = status.count;
        else if (status._id === "Rejected") rejected = status.count;
      });
    }
    
    const total = (statsData && statsData.totalAssignments && statsData.totalAssignments[0]) ? statsData.totalAssignments[0].total : 0;

    console.log("Professor Details:", user);
    res.render("professorProfile", { 
      activePage: "profile", 
      user,
      stats: {
        total,
        approved,
        rejected,
        submitted
      }
    });
  } catch (err) {
    console.error("Error loading professor profile:", err);
    res.status(500).send("Error loading professor profile");
  }
});




/************************************************************************************** */ 



router.get('/professor/review/:id', auth, restrictTo('Professor'), async (req, res) => {
  const id = req.params.id;
  const assignment = await AssignmentModel.findById(id);
  const student = await userModel.findById(assignment.studentId);
  const user = await userModel.findOne({ email: req.user.email });
  console.log("Assignment Details:", student);
  res.render("ProffesorReview", { activePage: "dashboard", assignment, student, user, error: null });
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



router.post('/professor/review/submit/:id', auth, restrictTo('Professor'), (req, res) => {
  upload.single("signature")(req, res, async function (err) {
    const assignmentId = req.params.id;
    const userDetail = req.user;
    const user = await userModel.findOne({ email: userDetail.email });
    const assign = await AssignmentModel.findById(assignmentId);
    const student = await userModel.findById(assign.studentId);
    const hod = await userModel.find({ role: "HOD", departement: user.departement });

    if (err) {
      return res.render("ProffesorReview", {
        activePage: "dashboard",
        assignment: assign,
        student,
        user,
        error: err.message
      });
    }

    if (!req.file) {
      return res.render("ProffesorReview", {
        activePage: "dashboard",
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
        remarkMail("Professor", req.body.remarks, student.email, "Approved", assign.category, assign.title);
        const nextReviewer = (hod && hod.length > 0) ? hod[0].name : null;
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          signature_url,
          approvedBy: "Professor",
          rejectedBy: null,
          status: "Forwarded",
          currentReviewer: nextReviewer,
          remark: req.body.remarks
        });
      } else {
        remarkMail("Professor", req.body.remarks, student.email, "Rejected", assign.category, assign.title);
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          signature_url,
          rejectedBy: "Professor",
          approvedBy: null,
          status: "Rejected",
          currentReviewer: null,
          remark: req.body.remarks
        });
      }

      res.redirect('/professor/myReview?success=true');
    } catch (uploadErr) {
      console.error("Cloudinary upload/DB update error:", uploadErr);
      return res.render("ProffesorReview", {
        activePage: "dashboard",
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