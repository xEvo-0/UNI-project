require('dotenv').config();
const express = require('express');
const path = require('path');
const  ejs = require('ejs');
const cookieParser = require('cookie-parser');

const adminRoutes = require('./routes/adminRoutes');
const dataSeeding = require('./routes/dataSeeding')
const studentRoutes = require('./routes/studentRoutes');
const professorRoutes = require('./routes/professorRoutes');
const hodRoutes = require('./routes/hodRoutes');
const authRoutes = require('./routes/authRoutes');
const DBconnect = require("./model/schema/DbConnect");


// npx @tailwindcss/cli -i ./src/input.css -o ./public/css/output.css
// email = admin@gamil.com
// passwored = admin


DBconnect();
// dataSeeding.departmentSeeding()
// dataSeeding.Userseeding()    
// dataSeeding.assignmentSeeding()


const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views/authentication'),
  path.join(__dirname, 'views/admin'),
  path.join(__dirname, 'views/student'),
  path.join(__dirname, 'views/professor'),
  path.join(__dirname, 'views/hod'),
]);


app.get('/', (req, res) => {
  res.render("login",{email:"",msg1:"",msg2:""});
});



app.use('/', adminRoutes);
app.use('/', studentRoutes);
app.use('/', professorRoutes);
app.use('/', hodRoutes);
app.use('/', authRoutes);



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


