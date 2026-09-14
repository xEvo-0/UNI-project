const jwt = require('jsonwebtoken');
const userModel = require('../model/schema/Registeration');
const key = "this is secret key";
const bcrypt = require('bcrypt');


const admin = { email: 'admin@gmail.com', password: 'admin' };

module.exports.loginPost = async (req, res) => {
  const {email, password } = req.body;
  console.log('Login attempt:', email, password);



  if (email === admin.email && password === admin.password) {
    const token = jwt.sign({ username: email, role: "admin" }, key, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/adminDashboard');
  }
  else{
  
  let user;

  try{
  user = await userModel.findOne({ email: email});
  console.log(user);
  }
  catch(err){
    console.log("mongoose error....")
  }


  if (!user) {
    return res.render("login", {email:"", msg1: "User not found!", msg2: "" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", { email,msg1: "", msg2: "Incorrect password!" });
  }

  const token = jwt.sign({ email: user.email ,role:user.role}, key, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  //Redirect to OTP verification page
 return res.redirect("/verifyOTP");

  // Redirect based on role
// if (user.role === "HOD") {
//   return res.redirect("/hodDashboard");
// } 
// else if (user.role === "Professor") {
//   return res.redirect("/professorDashboard");
// } 
// else if (user.role === "Student") {
//   return res.redirect("/studentDashboard");
// } 


  }
};
