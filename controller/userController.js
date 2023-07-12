const session = require("express-session")
const User=require("../model/userModel")
const Product=require("../model/productModel")
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
const passwordValidator= require('password-validator')
  


//===================VALIDATING PASSWORD=======================//
var schema = new passwordValidator();


schema
.is().min(8)                        
.is().max(100)                        
.has().uppercase()                             
.has().lowercase()                             
.has().digits(2)                               
.has().not().spaces()  



//====================BCRYPT==================================//
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (err) {
    console.log(err.message);
  }
};


//===================HOME PAGE LOAD===========//
async function loadHome(req, res, next) {
  try {
    if (req.session.user_id) {
      const session = req.session.user_id;
      res.render("home");
    } else {
      const session = null;
      res.render("home");
    }
  } catch (error) {
    next(error);
  }
}
  

  //================LOGIN PAGE LOAD==============//

  const loginLoad = async (req,res,next)=>{
    try {
        if(req.session.user_id){
            res.render('home')
        }
        else{
            res.render('login')
        }
    } catch (error) {
        next(error)
    }
  }

  //==============REGISTRATION PAGE LOAD=======//


  const loadRegister= async(req,res,next)=>{
    try {
        res.render('registration')
    } catch (error) {
        next(error)
    }
  }

//==================RGISTERING USER=============//

const insertUser = async (req, res, next) => {
  try {
    const userWithEmail = await User.findOne({ email:req.body.email });
  const userWithMobile = await User.findOne({ mobile: req.body.mobile});
  const userWithUsername = await User.findOne({ name: req.body.name });

  if (userWithEmail) {
    return res.render("registration", { message: "Email already exists." });
  }

  if (userWithMobile) {
    return res.render("registration", { message: "Mobile number already exists." });
  }

  if (userWithUsername) {
    return res.render("registration", { message: "Username already exists." });
  }
  const password=req.body.password  
  const passStrong = await schema.validate(password)

    if (!passStrong) {
      res.render("registration", {message: "Add minimum 8 charectors,includes uppercase,lovercase,and atleast 20digits",});
      return
    }
  const spassword = await securePassword(password)
      const user = new User({
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        password: spassword,
        is_admin: 0,
      });
      const userData = await user.save();
      email=req.body.email
      console.log(user)
      // check if email, mobile, and username already exist
  

      if (userData) {
        // Registration successful
        randomnumber = Math.floor(Math.random() * 9000) + 1000;
        otp = randomnumber;
        console.log(otp);
        sendVerifyMail(req.body.name, req.body.email, randomnumber);
        return res.redirect('/OTP');
      } else {
        return res.render('registration', { message: 'Your registration has failed' });
      }
  } catch (err) {
    next(err);
  }
};




//=======================VERIFY LOGIN======================//



  const verifylogin=async (req,res)=>{
    try {
      
        const email=req.body.email
        const password=req.body.password

        const userData = await User.findOne({email:email})

        if(userData){
                const passwordMatch = await bcrypt.compare(password,userData.password)
                if(passwordMatch){
                    if(userData.is_verified===1){
                        req.session.user_id=userData._id
                        res.redirect('/home')
                        
                    }else{
                        res.render('login',{message:'Please check your email'})
                    }
                }else{
                    res.render('login',{message:'E-mail and password incorrect'})
                }
        }else{
            res.render('login',{message:'E-mail and password incorrect'})
        }

    } catch (error) {
        console.log(error.message)
    }
}

//---------------- USER OTP VERIFICATION PAGE SHOWING SECTION START
const loadOtpVerification = async(req,res,next)=>{
  try{
      res.render('OTP');
  }catch(err){
    next(err);
  }
}
//---------------- USER SEND EMAIL VERIFICATION SECTION START
const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:  process.env.email,
        pass:  process.env.password,
      }
    });

    const mailOption = {
      from: process.env.email,
      to: email,
      subject: 'Verification Email',
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/otp">here</a> to verify and enter your verification email. This is your OTP: ${otp}</p>`
    };

    const info = await transporter.sendMail(mailOption);
    console.log("Email has been sent", info.response);

  } catch (error) {
    console.log(error.message);
  }
};



//---------------- USER EMAIL VERIFICATION SECTION START
const verifyEmail = async (req,res,next)=>{
  const otp2= req.body.otp;
  try { 
      if(otp2==otp){
        console.log(otp2,'ssssssss',otp)
          const UserData = await User.findOneAndUpdate({email:email},{$set:{is_verified:1}});
          if(UserData){
            console.log('hiiiiiiiii')
            res.redirect("/login");
          }
          else{
              console.log('something went wrong');
          }
      }
      else{
          res.render('otpVerificaton',{message:"Please Check the OTP again!"})
      }
  } catch (err) {
    next(err);
  }
}

//====================PRODUCT PAGE RENDERING==========//

const loadProduct= async  (req,res)=>{

  try {
      res.render('product')
  } catch (error) {
      console.log(error.message)
  }

}


//=========================================================================//

  module.exports= {
    loadHome,
    loginLoad,
    loadRegister,
    insertUser,
    verifylogin,
    loadOtpVerification ,
    verifyEmail,
    loadProduct
    
  }