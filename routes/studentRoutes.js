require('dotenv').config();
const express = require('express');
const AssignmentModel = require('../model/schema/assignment')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const assignmentStatus = require('../model/query/studentDashboardQuery');
const DepartmentModel = require('../model/schema/Department');
const router = express.Router();
const auth = require('../controller/verifyAuthController');
const { restrictTo } = auth;
const userModel = require('../model/schema/Registeration');



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



//-----------------------------------------------------------------------------------------------------------



router.get('/studentDashboard', auth, restrictTo('Student'), async(req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const data = await assignmentStatus(user._id);
    const assignments = await AssignmentModel.find({ studentId: user._id }).sort({ createdAt: -1 }).limit(5);   // newest first.limit(5);
    console.log('Rendering student dashboard' , assignments);
    res.render("studentDashbord", { activePage: "dashboard" ,data,assignments});
  } catch (err) {
    console.error("Error loading student dashboard:", err);
    res.status(500).send("Error loading student dashboard");
  }
});



//-----------------------------------------------------------------------------------------------------------



router.get("/allAssignments", auth, restrictTo('Student'), async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        let page = parseInt(req.query.page) || 1;
        let limit = 5; // 5 assignments per page
        let skip = (page - 1) * limit;

        const status = req.query.status || "";
        const sort = req.query.sort || "newest";

        let query = { studentId: user._id };
        if (status) query.status = status;

        let sortOption = sort === "oldest"
            ? { createdAt: 1 }
            : { createdAt: -1 };

        const totalAssignments = await AssignmentModel.countDocuments(query);

        const assignments = await AssignmentModel.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.render("allAssignments", {
            assignments,
            status,
            sort,
            page,
            totalPages: Math.ceil(totalAssignments / limit)
        });
    } catch (err) {
        console.error("Error loading all assignments:", err);
        res.status(500).send("Error loading all assignments");
    }
});


//-----------------------------------------------------------------------------------------------------------



router.get('/studentProfile', auth, restrictTo('Student'), async (req, res) => {
  try {
    const userDetail = req.user;
    const user = await userModel.findOne({email:userDetail.email}); 
    
    // Fetch assignment stats for this student
    const totalAssignments = await AssignmentModel.countDocuments({ studentId: user._id });
    const approvedAssignments = await AssignmentModel.countDocuments({ studentId: user._id, status: 'Approved' });
    const draftAssignments = await AssignmentModel.countDocuments({ studentId: user._id, status: 'Draft' });
    const submittedAssignments = await AssignmentModel.countDocuments({ 
      studentId: user._id, 
      status: { $in: ['Submitted', 'Forwarded'] } 
    });

    console.log("User Details:", user);
    res.render("studentProfile", { 
      activePage: "profile" , 
      user,
      stats: {
        total: totalAssignments,
        approved: approvedAssignments,
        draft: draftAssignments,
        submitted: submittedAssignments
      }
    });
  } catch (err) {
    console.error("Error loading student profile:", err);
    res.status(500).send("Error loading student profile");
  }
});


//-----------------------------------------------------------------------------------------------------------


router.get('/preview/:id', auth, restrictTo('Student', 'Professor', 'HOD', 'H.O.D'), async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userModel.findOne({ email: req.user.email });
    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }
    if (user.role === "Student" && String(assignment.studentId) !== String(user._id)) {
      return res.status(403).send("Unauthorized access");
    }
    res.render("assignmentPreview", { activePage: "dashboard", assignment });
  } catch (err) {
    console.error("Error previewing assignment:", err);
    res.status(500).send("Error previewing assignment");
  }
});


/************************************************************************************** */ 



router.get('/api/professors', auth, restrictTo('Student'), async (req, res) => {
  try {
    const userDetail = req.user;
    const user = await userModel.findOne({ email: userDetail.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userDept = user.departement;
    const professors = await userModel.find({ role: 'Professor', departement: userDept }, 'name departement');
    res.json({ success: true, professors });
  } catch (err) {
    console.error("Error fetching professors:", err);
    res.status(500).json({ success: false, message: "Server error fetching professors" });
  }
});



/************************************************************************************** */ 



router.get('/submitReview/:id', auth, restrictTo('Student'), async(req, res) => {
  try {
    const assignmentId = req.params.id;
    const userDetail = req.user;
    const user = await userModel.findOne({email:userDetail.email}); 
    const assignment =  await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }
    if (String(assignment.studentId) !== String(user._id)) {
      return res.status(403).send("Unauthorized access");
    }
    const userDept = user.departement;
    const professors = await userModel.find({ role: 'Professor', departement: userDept });
    res.render("assignmentDetail", { activePage: "dashboard" , assignment,professors });
  } catch (err) {
    console.error("Error loading submit review page:", err);
    res.status(500).send("Error loading submit review page");
  }
});



/************************************************************************************** */ 



router.post('/submitReview/:id', auth, restrictTo('Student'), async(req, res) => {
  try {
    const assignmentId = req.params.id;
    const userDetail = req.user;
    const user = await userModel.findOne({email:userDetail.email}); 
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }
    if (String(assignment.studentId) !== String(user._id)) {
      return res.status(403).send("Unauthorized access");
    }
    console.log("Reviewer ID from form:", req.body.reviewer);
    await AssignmentModel.findByIdAndUpdate(
      assignmentId,
      { 
        submittedBy: user.name,
        status: "Submitted" ,
        currentReviewer: req.body.reviewer,
        professorName: req.body.reviewer
      }
    );  
    res.redirect('/allAssignments');
  } catch (err) {
    console.error("Error submitting assignment for review:", err);
    res.status(500).send("Error submitting assignment for review");
  }
});



//-----------------------------------------------------------------------------------------------------------



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("application/pdf")) {
      const uploadpath = path.join(__dirname,"..", 'uploads')
      console.log("upload path :",uploadpath)
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
    fieldSize: 50 * 1024 * 1024
  }
})



//-----------------------------------------------------------------------------------------------------------



router.get('/single-upload', auth, restrictTo('Student'), (req, res) => {
  res.render("singleUpload", { activePage: "dashboard"});
});


/************************************************************************************** */ 


router.post('/uploadAssignment', auth, restrictTo('Student'), upload.single('singleUpload'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'my-app-uploads',
      resource_type: 'raw', 
      filename_override: req.file.originalname, 
      use_filename: true,
      unique_filename: false
    });

    const {title, description, category} = req.body;

    const preview_url = result.secure_url;
    const download_url = result.secure_url.replace("/upload/", "/upload/fl_attachment/");
  
    const userDetail = req.user;
    const user = await userModel.findOne({email:userDetail.email}); 

    const ack = await AssignmentModel.create({
      studentId: user._id,
      submittedBy: user.name,
      title:title,
      description:description,
      category:category,
      filename: [req.file.originalname],
      status: "Draft",
      currentReviewer: null,
      download_url:[download_url],
      preview_url: [preview_url]
    });

    console.log({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: "Assignment uploaded successfully!" });
    }
    res.redirect('/studentDashboard');
  } catch (err) {
    console.error(err);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: "Something went wrong try again later..." });
    }
    res.render("singleUpload", { error: "Something went wrong try again later..." ,activePage: "dashboard" });
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err && err.code !== 'ENOENT') console.error("Error deleting temp student file:", err);
      });
    }
  }
});



//-----------------------------------------------------------------------------------------------------------



router.get('/bulk-upload', auth, restrictTo('Student'), (req, res) => {
  res.render("bulkUpload", { activePage: "dashboard"});
});




/************************************************************************************** */ 




router.post('/uploadBulkAssignments', auth, restrictTo('Student'), upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const { title, description, category } = req.body;

    
    const preview_url = [] ;
    const download_url = [] ;
    const filename = [];

    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'my-app-uploads',
        resource_type: 'raw',  
        filename_override: file.originalname,
        use_filename: true,
        unique_filename: false
      });
      filename.push(file.originalname);
      preview_url.push(result.secure_url);
      download_url.push(result.secure_url.replace("/upload/", "/upload/fl_attachment/"));
    }


    const userDetail = req.user;
    const user = await userModel.findOne({email:userDetail.email}); 

    await AssignmentModel.create({
      studentId: user._id,
      submittedBy: user.name,
      title,
      description,
      category,
      filename: filename,
      status: "Draft",
      currentReviewer: null,
      download_url: download_url,
      preview_url:preview_url
    });

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: "Assignments uploaded successfully!" });
    }
    res.redirect('/studentDashboard');

  } catch (err) {
    console.error(err);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: "Something went wrong, try again later..." });
    }
    res.render("bulkUpload", {
      error: "Something went wrong, try again later...",
      activePage: "dashboard"
    });
  } finally {
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err && err.code !== 'ENOENT') console.error("Error deleting temp bulk file:", err);
          });
        }
      }
    }
  }
});











module.exports = router;