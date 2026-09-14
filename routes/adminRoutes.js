const express = require('express');
const userModel = require('../model/schema/Registeration');
const departmentModel = require("../model/schema/Department")
const router = express.Router();
const bcrypt = require('bcrypt');
const dashboardQuery = require('../model/query/dashBoardQuery');
const allDepartments = require('../model/query/DepartmentQuery');
const auth = require('../controller/verifyAuthController');
const { restrictTo } = auth;




/************************************************************************************** */ 



router.get('/adminDashboard', auth, restrictTo('admin'), async (req, res) => {
  const data = await dashboardQuery.getUserStats();
  const deptCount = await dashboardQuery.getDepartmentCount();
  console.log('Rendering admin dashboard');
  res.render("adminDashbord", { data, deptCount });
});



/************************************************************************************/



router.get('/Departments', auth, restrictTo('admin'), async (req, res) => {
  console.log("Rendering Department page");

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || "";
  const programmeType = req.query.programmeType || "";
  const address = req.query.address || "";

  const filter = {};

  if (search) {
    filter.$or = [
      { departmentName: { $regex: search, $options: "i" } },
      { programmeType: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } }
    ];
  }

  if (programmeType) {
    filter.programmeType = programmeType;
  }

  if (address) {
    filter.address = address;
  }

  const addressList = await departmentModel.distinct("address");

  const totalDepartments = await departmentModel.countDocuments(filter);
  const data = await departmentModel.find(filter).skip(skip).limit(limit);

  const totalPages = Math.ceil(totalDepartments / limit);

  res.render("Departments", {
    data,
    currentPage: page,
    totalPages,
    search,
    programmeType,
    address,
    addressList
  });
});



/************************************************************************************** */ 



router.get('/addDepartment', auth, restrictTo('admin'), async (req, res) => {
  console.log('Rendering addDepartment page');
  res.render("addDepartment");
});



/************************************************************************************** */ 



router.post('/addDepartment', auth, restrictTo('admin'), async (req, res) => {
  const { deptName, programType, address } = req.body;
  await departmentModel.create({
    departmentName: deptName,
    programmeType: programType,
    address: address
  })

  console.log(deptName, programType, address);

  res.redirect('/Departments');
});



/************************************************************************************** */ 




router.get('/editDepartment/:id', auth, restrictTo('admin'), async (req, res) => {
  console.log('Rendering edit users page');
  const deptData = await departmentModel.findById(req.params.id);
  res.render("editDepartment", { deptData });
});



/************************************************************************************** */ 



router.post('/update-dept/:id', auth, restrictTo('admin'), async (req, res) => {
  const { deptName, programType, address } = req.body;
  const id = req.params.id;
  await departmentModel.findByIdAndUpdate(id, {
    departmentName: deptName,
    programmeType: programType,
    address: address
  },
    { new: true, runValidators: true }
  )

  res.redirect('/Departments');
});


/************************************************************************************** */ 


router.post('/deleteDepartment/:id', auth, restrictTo('admin'), async (req, res) => {
  console.log('deleting department');
  await departmentModel.findByIdAndDelete(req.params.id);
  res.redirect("/departments")
});



/************************************************************************************** */ 


// router.get('/Departments', async (req, res) => {
//   console.log('Rendering Department page');
//   const page = parseInt(req.query.page) || 1;
//   const limit = 5;
//   const skip = (page - 1) * limit;
//   const totalDepartments = await departmentModel.countDocuments();
//   const data = await departmentModel.find().skip(skip).limit(limit);
//   const totalPages = Math.ceil(totalDepartments / limit);
//   res.render("Departments", { data, currentPage: page, totalPages });
// });



/************************************************************************************/


  

router.get('/users', auth, restrictTo('admin'), async (req, res) => {
  console.log('Rendering user page');

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || "";
  const role = req.query.role || "";
  const department = req.query.department || "";

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (department) {
    filter.departement = department;
  }

  const totalUsers = await userModel.countDocuments(filter);

  const users = await userModel.find(filter).skip(skip).limit(limit);

  const departments = await departmentModel.find();

  const totalPages = Math.ceil(totalUsers / limit);

  res.render("users", {
    users,
    departments,
    search,
    role,
    department,
    currentPage: page,
    totalPages
  });
});



/************************************************************************************** */ 




router.get('/addUsers', auth, restrictTo('admin'), async (req, res) => {
  console.log('Rendering add users page');
  const alldepartments = await allDepartments();
  const error = req.query.error || null;
  res.render("addUser", { alldepartments, error });
});



/************************************************************************************** */ 



router.post('/add-users', auth, restrictTo('admin'), async (req, res) => {
  const { name, email, password, phone, department, role } = req.body;

  if (!name || !name.trim()) return res.redirect('/addUsers?error=Full name is required.');
  if (!email || !email.trim()) return res.redirect('/addUsers?error=Email address is required.');
  if (!password || !password.trim()) return res.redirect('/addUsers?error=Password is required.');
  if (!phone) return res.redirect('/addUsers?error=Phone number is required.');
  if (!department) return res.redirect('/addUsers?error=Department is required.');
  if (!role) return res.redirect('/addUsers?error=User role is required.');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.redirect('/addUsers?error=Please enter a valid email address.');
  }

  if (password.length < 6) {
    return res.redirect('/addUsers?error=Password must be at least 6 characters long.');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(String(phone).trim())) {
    return res.redirect('/addUsers?error=Phone number must be exactly 10 digits.');
  }

  const existingEmail = await userModel.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.redirect(`/addUsers?error=The email ${email} is already registered.`);
  }

  if (role === 'HOD') {
    const existingHOD = await userModel.findOne({ role: 'HOD', departement: department });
    if (existingHOD) {
      return res.redirect(`/addUsers?error=An HOD (${existingHOD.name}) already exists for the ${department} department.`);
    }
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await userModel.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: Number(phone),
    departement: department,
    role: role
  });

  res.redirect("/users");
});



/************************************************************************************** */ 



router.post('/update-user/:id', auth, restrictTo('admin'), async (req, res) => {
  const { name, email, password, phone, department, role } = req.body;
  const id = req.params.id;

  const existingUser = await userModel.findById(id);
  if (!existingUser) {
    return res.redirect('/users?error=User not found.');
  }

  if (!name || !name.trim()) return res.redirect(`/editUser/${id}?error=Full name is required.`);
  if (!email || !email.trim()) return res.redirect(`/editUser/${id}?error=Email address is required.`);
  if (!phone) return res.redirect(`/editUser/${id}?error=Phone number is required.`);
  if (!department) return res.redirect(`/editUser/${id}?error=Department is required.`);
  if (!role) return res.redirect(`/editUser/${id}?error=User role is required.`);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.redirect(`/editUser/${id}?error=Please enter a valid email address.`);
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(String(phone).trim())) {
    return res.redirect(`/editUser/${id}?error=Phone number must be exactly 10 digits.`);
  }

  const duplicateEmail = await userModel.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
  if (duplicateEmail) {
    return res.redirect(`/editUser/${id}?error=The email ${email} is already registered by another user.`);
  }

  if (role === 'HOD') {
    const existingHOD = await userModel.findOne({ role: 'HOD', departement: department, _id: { $ne: id } });
    if (existingHOD) {
      return res.redirect(`/editUser/${id}?error=An HOD (${existingHOD.name}) already exists for the ${department} department.`);
    }
  }

  let hashedPassword = existingUser.password;
  if (password && password.trim() !== '') {
    if (password.length < 6) {
      return res.redirect(`/editUser/${id}?error=Password must be at least 6 characters long.`);
    }
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  await userModel.findByIdAndUpdate(id, {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: Number(phone),
    departement: department,
    role: role
  },
    { new: true, runValidators: true }
  );

  res.redirect("/users");
});


/************************************************************************************** */ 


router.get('/editUser/:id', auth, restrictTo('admin'), async (req, res) => {
  console.log('Rendering edit users page');
  const userData = await userModel.findById(req.params.id);
  const alldepartments = await allDepartments();
  const error = req.query.error || null;
  res.render("editUser", { userData, alldepartments, error });
});


/************************************************************************************** */ 


router.post('/deleteUser/:id', auth, restrictTo('admin'), async (req, res) => {
  console.log('deleting user');
  await userModel.findByIdAndDelete(req.params.id);
  res.redirect("/users")
});




module.exports = router ;