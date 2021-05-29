require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
var faker = require('faker');
const session = require("express-session");
const fs = require('fs')
const { format } = require('@fast-csv/format');


const app = express();

app.set('view engine', 'ejs');


app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({secret: 'keyboard cat',resave: false,saveUninitialized: false,expires:false}));

mongoDBurl = "mongodb+srv://admin-nadav:"+process.env.DB_PASS+"@cluster0.ohzh4.mongodb.net/becsDB";

mongoose.connect(mongoDBurl, {useNewUrlParser: true, useUnifiedTopology: true });

const donateSchema = {
  id_donate: String,
  firstname: String,
  lastname: String,
  gender: String,
  birthdate: String,
  donate_date: String,
  phone_number: String,
  resident: String,
  bloodType: String,
  isSmoker: Boolean
}

const userSchema = {
  user_id: String,
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  user_type: String
}

const Donate = mongoose.model("Donate", donateSchema);

const User = mongoose.model("User",userSchema);

// generateUsers();

var types = ["A+","B+","AB+","O+","A-","B-","AB-","O-"];

const a_plus = {type: "A+",name:"Aplus", common: 0.34, donate: ["A+","AB+"], receive: ["A+","A-","O+","O-"]};
const b_plus = {type: "B+",name:"Bplus", common: 0.17, donate: ["B+","AB+"], receive: ["B+","B-","O+","O-"]};
const ab_plus = {type: "AB+",name:"ABplus", common: 0.07, donate: ["AB+"], receive: ["A+","B+","AB+","O+","A-","B-","AB-","O-"]};
const o_plus = {type: "O+",name:"Oplus", common: 0.32, donate: ["A+","B+","AB+","O+"], receive: ["O+","O-"]};
const a_minus = {type: "A-",name:"Aminus", common: 0.04, donate: ["A+","A-","AB+","AB-"], receive: ["A-","O-"]};
const b_minus = {type: "B-",name:"Bminus", common: 0.02, donate: ["B+","B-","AB+","AB-"], receive: ["B-","O-"]};
const ab_minus = {type: "AB-",name:"ABminus", common: 0.01, donate: ["AB+","AB-"], receive: ["A-","B-","AB-","O-"]};
const o_minus = {type: "O-",name:"Ominus", common: 0.03, donate: ["A+","B+","AB+","O+","A-","B-","AB-","O-"], receive: ["O-"]};
const bloodTypes = {
  'A+': a_plus,
  'B+': b_plus,
  'AB+': ab_plus,
  'O+': o_plus,
  'A-': a_minus,
  'B-': b_minus,
  'AB-': ab_minus,
  'O-': o_minus
};


app.get("/", function(req,res){
  res.render("workNav");
});

app.get("/becs", function(req,res){
  req.session.User = {
    usertype: "none",
    id: "",
    email: ""
  }
  res.render("userHome",{user: req.session.User});
});

app.get("/part-11",function(req,res){
  req.session.User = {
    usertype: "user",
    id: "",
    email: ""
  }
  res.render("userHome",{user: req.session.User});
});

app.get("/generate", function(req,res){
  generateData();
  res.render("userHome",{user: req.session.User});
});

app.get("/logout", function(req,res){
  logger(req.session.User,"Logout");
  req.session.destroy();
  res.redirect("/login");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.post("/login", function(req,res){
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email}, function(err,userFound){
    if(err){
      console.log(err);
      res.render("login");
    } else {
      if(userFound){
        if(userFound.password === password){
          req.session.User = {
            usertype: userFound.user_type,
            id: userFound.user_id,
            email: userFound.email
          }
          logger(req.session.User,"Login");
          res.render("userHome",{user: req.session.User});
        } else {
          res.render("login");
        }
      } else {
        res.render("login");
      }
    }
  });
});

app.get("/user-home", function(req,res){
  res.render("userHome",{user: req.session.User});
});

app.get("/reception", function(req,res){
  res.render("reception");
});

app.post("/addBlood",async function(req,res){
  var date = new Date();
  var newDonate = new Donate({
    id_donate: req.body.id,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    gender: req.body.gender.value,
    birthdate: new Date(req.body.birthdate).toISOString().split("T")[0],
    donate_date: date.toISOString().split("T")[0],
    phone_number: req.body.phone_number,
    resident: req.body.resident,
    bloodType: req.body.blood_type,
    isSmoker: req.body.smoker.value == "Yes" ? true : false
  });
  newDonate.save();
  var info = "received new blood unit of type " + newDonate.bloodType + ", id: " + newDonate._id;
  logger(req.session.User, info);
  res.render("reception");
});

app.get("/provide", function(req,res){
  res.render("provide");
});

app.post("/provide", async function(req,res){
  const requestedBloodType = bloodTypes[req.body.blood_type];
  var requestedAmount = parseInt(req.body.quantity);

  receiveTypes = [];
  var typeObj;

  for(var i=0; i<requestedBloodType.receive.length; i++){
    typeObj = bloodTypes[requestedBloodType.receive[i]];
    typeObj["supply"] = 0;
    receiveTypes.push(typeObj);
  }

  receiveTypes = await getQuantity(receiveTypes);
  sortByPriority(receiveTypes);

  var refresh =  5;
  var notEnoughUnits = "hidden";
  while(requestedAmount > 0){
    if(requestedAmount < refresh){
      refresh = requestedAmount;
    }

    amountToProvide = await bloodSupply(receiveTypes[0],refresh);
    if (amountToProvide == 0){
      notEnoughUnits = "visible";
      break;
    }
    requestedAmount -= amountToProvide;
    sortByPriority(receiveTypes);
  }
  var unitsToProvide = await findAndUpdateBloodUnits(receiveTypes);
  var info = "Requested: " + req.body.quantity + " for " + requestedBloodType.type + " Provided: " + unitsToProvide.length + " - ";
  for(var i=0; i<receiveTypes.length; i++){
    if(receiveTypes[i].supply > 0){
      if(i != 0){
        info += ", ";
      }
      info += receiveTypes[i].supply + " of " + receiveTypes[i].type;
    }
  }
  logger(req.session.User,info);
  res.render("provideResults",{type: requestedBloodType, quantity: req.body.quantity, bloodunits: unitsToProvide, notEnoughFlag: notEnoughUnits});
});


app.get("/provide-emergency", function(req,res){
  res.render("provideEmergency");
});

app.post("/provide-emergency", async function(req,res){
  var unitsToSupply = parseInt(req.body.quantity);
  var notEnoughUnits = "hidden";
  var oMinus = o_minus;
  oMinus.supply = 0;
  oMinus = await getQuantity([oMinus]);
  if(oMinus.quantity < unitsToSupply){
    unitsToSupply = oMinus.quantity;
    notEnoughUnits = "visible";
  }
  oMinus.supply = unitsToSupply;
  var unitsToProvide = await findAndUpdateBloodUnits([oMinus]);
  var info = "Emergency Requested: " + req.body.quantity + " for O-.  Provided: " + unitsToProvide.length;
  logger(req.session.User,info);
  res.render("provideResults",{type: oMinus, quantity: req.body.quantity, bloodunits: unitsToProvide, notEnoughFlag: notEnoughUnits});
});

app.get("/create-users", function(req,res){
  res.render("createUsers");
});

app.post("/create-users", function(req,res){
  var newUser = new User({
    user_id: req.body.id,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    user_type: req.body.user_type
  });
  newUser.save();
  var info = "created new user: id - " + newUser.user_id + " email - " + newUser.email + " user type - " + newUser.user_type;
  logger(req.session.User,info);
  res.render("createUsers");
});

app.get("/view-database", function(req,res){
  logger(req.session.User,"viewed database");
  Donate.find({},function(err,bloodUnits){
    if(err){
      console.log(err);
    } else if(bloodUnits){
      res.render("database",{database: bloodUnits, user: req.session.User});
    }
  });
});

app.post("/database-query",async function(req,res){
  const blood_type = req.body.blood_type;
  const gender = req.body.gender;
  const donate_date = req.body.donate_date;
  const smoker = req.body.smoker;
  var query = {};
  if(blood_type != "All"){
    query.bloodType = blood_type;
  }
  if(gender != "Both"){
    query.gender = gender;
  }
  if(smoker != "Both"){
    query.isSmoker = smoker;
  }
  if(donate_date != ""){
    query.donate_date = donate_date;
  }
  var info = "viewed database by query: " + query;
  logger(req.session.User,info);
  var queryResult = await Donate.find(query).exec();
  res.render("database",{database: queryResult, user:req.session.User});
});

app.get("/export-log-file", function(req,res){
  res.setHeader('Content-disposition', 'attachment; filename=log_file.log');
  res.set('Content-Type', 'text/plain');
  res.download(__dirname + '/log_file.log');
});

app.post("/export-database",async function(req,res){
  var writeStream = fs.createWriteStream("bloodBankDatabase.csv");
  const csvStream = format({ headers: true });
  csvStream.pipe(writeStream).on('finish', () => {
    res.setHeader('Content-disposition', 'attachment; filename=bloodBankDatabase.csv');
    res.set('Content-Type', 'text/csv');
    res.download(__dirname + '/bloodBankDatabase.csv');
  });
  await createCSVfile(csvStream,req.session.User.usertype);
});

async function createCSVfile(csvStream,usertype){
  dataToExport = await Donate.find({}).exec();
  if(usertype === "admin" || usertype === "user"){
    dataToExport.forEach((record,i) => {
      csvStream.write({
        "Donate ID": record._id,
        "ID": record.id_donate,
        "First Name": record.firstname,
        "Last Name": record.lastname,
        "Phone Number": record.phone_number,
        "Birth Date": record.birthdate,
        "Resident": record.resident,
        "Gender": record.gender,
        "Donate Date": record.donate_date,
        "Blood Type": record.bloodType,
        "Is Smoker": record.isSmoker
        });
      }
    );
} else {
  dataToExport.forEach((record,i) => {
    csvStream.write({
      "Donate ID": record._id,
      "Gender": record.gender,
      "Donate Date": record.donate_date,
      "Blood Type": record.bloodType,
      "Is Smoker": record.isSmoker
      });
    }
  );
  }
  csvStream.end();
}

async function findAndUpdateBloodUnits(receiveTypes){
  var bloodUnitsToProvide = [];
  for(var i=0; i<receiveTypes.length; i++){
    if(receiveTypes[i].supply > 0){
      bloodUnits = await Donate.find({bloodType: receiveTypes[i].type}).exec();
      sortByDate(bloodUnits);
      for(var j=0; j<receiveTypes[i].supply; j++){
        bloodUnitsToProvide.push({
          type: bloodUnits[j].bloodType,
          id: bloodUnits[j]._id
        });
        await Donate.deleteOne({_id: bloodUnits[j]._id}).exec();
      }
    }
  }
  return bloodUnitsToProvide;
}

async function getQuantity(receiveTypes){
  var quantity;
  for(var i=0; i<receiveTypes.length; i++){
    quantity = await Donate.find({bloodType: receiveTypes[i].type}).exec();
    receiveTypes[i]["quantity"] = quantity.length;
  }
  return receiveTypes;
}

async function updateBlood(bloodType,oldAmount,newBloodUnits){
  await Type.findOneAndUpdate({type: bloodType}, {quantity: oldAmount + newBloodUnits}).exec();
}

async function bloodSupply(type,amount){
  var amountTaken;
  if(type.quantity - type.supply < amount){
    amountTaken = type.quantity - type.supply;
  } else {
    amountTaken = amount;
  }
  type.supply += amountTaken;
  return amountTaken;
}

function sortByDate(bloodUnitsArray){
  bloodUnitsArray.sort(function(unit1,unit2){
    return new Date(unit1.donate_date) - new Date(unit2.donate_date);
  });
}

function sortByPriority(bloodTypesArray){
  bloodTypesArray.sort(function(type1,type2){
    return  priority(type2) - priority(type1);
  });
}

function priority(type){
  return ((type.quantity-type.supply)*type.common) / type.donate.length;
}

function logger(user,info){
  var date = new Date().toISOString().split("T")[0];
  var time = new Date().toLocaleTimeString();
  var user = user.email;
  var content = date + " " + time + "\t" + user + "\t" + info + '\r\n';
  fs.appendFile(__dirname + '/log_file.log', content, { flag: 'a+' }, err => {})
}

function generateData(){
  var newDonate;
  for(var i=0; i<200; i++){
    var randomGender = Math.floor(Math.random() * 2);
    var randomSmoking = Math.floor(Math.random() * 2);
    var randomBlood = Math.floor(Math.random() * 8);
    newDonate = new Donate({
        id_donate: i,
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        gender: randomGender == 0 ? 'Female' : 'Male',
        birthdate: faker.date.between('1960-01-01','2005-12-31').toISOString().split("T")[0],
        donate_date: faker.date.between('2020-01-01','2020-05-26').toISOString().split("T")[0],
        phone_number: faker.phone.phoneNumberFormat(),
        resident: faker.address.city(),
        bloodType: types[randomBlood],
        isSmoker: randomGender == 0 ? false : true,
      });
    newDonate.save();
  }
}

function generateUsers(){
  var admin = new User({
    user_id: "123456789",
    firstname: "Super",
    lastname: "User",
    email: "superUserBECS@gmail.com",
    password: "123",
    user_type: "admin"
  });
  admin.save();
  var employee = new User({
    user_id: "987654321",
    firstname: "Employee",
    lastname: "Bank",
    email: "employee@gmail.com",
    password: "123",
    user_type: "employee"
  });
  employee.save();
  var student = new User({
    user_id: "192837465",
    firstname: "Student",
    lastname: "Research",
    email: "student@gmail.com",
    password: "123",
    user_type: "student"
  });
  student.save();
}

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
