const express = require('express');
const authController = require('../controller/authController');
const otpSchema = require("../model/schema/otpSchema")
const router = express.Router();
const {otpMail,remarkMail} = require('../controller/brevoMailer')
const userModel = require('../model/schema/Registeration');
const bcrypt = require('bcrypt');
const auth = require('../controller/verifyAuthController');



// (remarkBy, remark, email, status)
//remarkMail("Proffesor","very good need improvement","rkstarlord@gmail.com","Rejected")


router.post('/login',authController.loginPost);
 
router.get('/verifyOTP', auth, async (req, res) => {
  otpMail(req.user.email)
  console.log(req.user.email);
  console.log("mail sent succesfully....")
  res.render("OTP", { msg: "" })
});

router.post('/verifyOTP', auth, async (req, res) => {
  const otp = req.body.otp.join("");
  const user = req.user;
  const ServerOTP = await otpSchema.findOne({email:user.email});

  if (otp == ServerOTP.otp) {
    if (user.role === "Student") return res.redirect("/studentDashboard");
    if (user.role === "Professor") return res.redirect("/professorDashboard");
    if (user.role === "H.O.D" || user.role === "HOD") return res.redirect("/hodDashboard");
  }
  res.render("OTP", { msg: "wrong" });
});





//-----------------------------------------------------------------------------------------
                              


router.get('/forget', (req, res) => {
  res.render('forget-password', { step: 'email', email: '' });
});

router.post('/send-otp', (req, res) => {
  console.log(req.body);
  otpMail(req.body.email)
  res.render('forget-password', { step: 'otp', email :req.body.email });
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  console.log(req.body)
  try {
    const ServerOTP = await otpSchema.findOne({ email: email });
    
    if (!ServerOTP) {
      return res.send('No OTP found for this email.');
    }

    if (otp == ServerOTP.otp) {
      return res.render('forget-password', { step: 'newPassword', email });
    } else {
        res.render("forget-password", { step: 'otp', email :req.body.email , msg: 'wrong'});
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/reset-password', async (req, res) => {
  const {email,password} = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log(req.body)
  await userModel.findOneAndUpdate(
      {email},
      { 
        password: hashedPassword,
      })
  res.redirect('/')
});



//-------------------------------------------------------------------------------------------



router.get('/logout', (req, res) => {
  res.clearCookie('token');
  console.log("User logged out, redirecting to login page.");
  res.redirect('/');
});




module.exports = router;