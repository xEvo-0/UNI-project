const mongoose = require('mongoose');
require('dotenv').config();
const URL =  process.env.MONGODB_URL;



function DBconnect(){
    mongoose.connect(URL)
    .then(()=> console.log(" Database connected ...."))
    .catch((err)=> console.log("error occured   :  " + err));
}


module.exports = DBconnect;
