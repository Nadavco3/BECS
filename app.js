const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');


const app = express();

app.set('view engine', 'ejs');


app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-nadav:123@cluster0.ohzh4.mongodb.net/becsDB', {useNewUrlParser: true, useUnifiedTopology: true });

const bloodSchema = {
  type: String,
  name: String,
  quantity: Number,
  common: Number,
  donate: Array,
  receive: Array
};

const Type = mongoose.model("Type", bloodSchema);

const a_plus = new Type({type: "A+",name:"Aplus" ,quantity: 50, common: 0.34, donate: ["A+","AB+"], receive: ["A+","A-","O+","O-"]});
const b_plus = new Type({type: "B+",name:"Bplus", quantity: 50, common: 0.17, donate: ["B+","AB+"], receive: ["B+","B-","O+","O-"]});
const ab_plus = new Type({type: "AB+",name:"ABplus", quantity: 50, common: 0.07, donate: ["AB+"], receive: ["A+","B+","AB+","O+","A-","B-","AB-","O-"]});
const o_plus = new Type({type: "O+",name:"Oplus", quantity: 50, common: 0.32, donate: ["A+","B+","AB+","O+"], receive: ["O+","O-"]});
const a_minus = new Type({type: "A-",name:"Aminus" ,quantity: 50, common: 0.04, donate: ["A+","A-","AB+","AB-"], receive: ["A-","O-"]});
const b_minus = new Type({type: "B-",name:"Bminus", quantity: 50, common: 0.02, donate: ["B+","B-","AB+","AB-"], receive: ["B-","O-"]});
const ab_minus = new Type({type: "AB-",name:"ABminus", quantity: 50, common: 0.01, donate: ["AB+","AB-"], receive: ["A-","B-","AB-","O-"]});
const o_minus = new Type({type: "O-",name:"Ominus", quantity: 50, common: 0.03, donate: ["A+","B+","AB+","O+","A-","B-","AB-","O-"], receive: ["O-"]});
const bloodTypes = [a_plus,b_plus,ab_plus,o_plus,a_minus,b_minus,ab_minus,o_minus];
// Type.insertMany(bloodTypes, function(err,docs){
// });

app.get("/", function(req,res){

  Type.find({}, function(err,foundItems){
    if(!err){
        res.render("recept_normal",{blood: foundItems});
    }
    else {
      console.log(err);
    }
  });
});

app.post("/addBlood",async function(req,res){
  const bloodUnits_Aplus = parseInt(req.body.Aplus);
  const bloodUnits_Bplus = parseInt(req.body.Bplus);
  const bloodUnits_ABplus = parseInt(req.body.ABplus);
  const bloodUnits_Oplus = parseInt(req.body.Oplus);
  const bloodUnits_Aminus = parseInt(req.body.Aminus);
  const bloodUnits_Bminus = parseInt(req.body.Bminus);
  const bloodUnits_ABminus = parseInt(req.body.ABminus);
  const bloodUnits_Ominus = parseInt(req.body.Ominus);
  const oldQuantity_Aplus = await Type.findOne({type: "A+"}, 'quantity -_id').exec();
  const oldQuantity_Bplus = await Type.findOne({type: "B+"}, 'quantity -_id').exec();
  const oldQuantity_ABplus = await Type.findOne({type: "AB+"}, 'quantity -_id').exec();
  const oldQuantity_Oplus = await Type.findOne({type: "O+"}, 'quantity -_id').exec();
  const oldQuantity_Aminus = await Type.findOne({type: "A-"}, 'quantity -_id').exec();
  const oldQuantity_Bminus = await Type.findOne({type: "B-"}, 'quantity -_id').exec();
  const oldQuantity_ABminus = await Type.findOne({type: "AB-"}, 'quantity -_id').exec();
  const oldQuantity_Ominus = await Type.findOne({type: "O-"}, 'quantity -_id').exec();
  await Type.findOneAndUpdate({type: "A+"}, {quantity: bloodUnits_Aplus + oldQuantity_Aplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "B+"}, {quantity: bloodUnits_Bplus + oldQuantity_Bplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "AB+"}, {quantity: bloodUnits_ABplus + oldQuantity_ABplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "O+"}, {quantity: bloodUnits_Oplus + oldQuantity_Oplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "A-"}, {quantity: bloodUnits_Aminus + oldQuantity_Aminus.quantity}).exec();
  await Type.findOneAndUpdate({type: "B-"}, {quantity: bloodUnits_Bminus + oldQuantity_Bminus.quantity}).exec();
  await Type.findOneAndUpdate({type: "AB-"}, {quantity: bloodUnits_ABminus + oldQuantity_ABminus.quantity}).exec();
  await Type.findOneAndUpdate({type: "O-"}, {quantity: bloodUnits_Ominus + oldQuantity_Ominus.quantity}).exec();
  const updatedBlood = await Type.find({}).exec();
  res.render("recept_normal",{blood: updatedBlood});
});


app.post("/giveBlood",async function(req,res){
  //take the blood type object from database according to what user chose in the combobox
  const requestedBloodType = await Type.findOne({type: req.body.bloodSelected}).exec();
  //the amount that the user typed in the input
  var requestedAmount = parseInt(req.body.bloodAmount);

  receiveTypes = [];
  var typeObj;

  for(var i=0; i<requestedBloodType.receive.length; i++){
    typeObj = await Type.findOne({type: (requestedBloodType.receive)[i]}).lean().exec();
    typeObj["supply"] = 0;
    receiveTypes.push(typeObj);
  }

  sortByPriority(receiveTypes);
  console.log(receiveTypes[0].type);
  var refresh =  5;
  var notEnoughUnits = "hidden";
  while(requestedAmount > 0){
    if(requestedAmount < refresh){
      refresh = requestedAmount;
    }

    amountToProvide = await bloodSupply(receiveTypes[0],refresh);
    if (amountToProvide == 0){
      console.log("Not Enough Blood Units");
      notEnoughUnits = "visible";
      break;
    }
    requestedAmount -= amountToProvide;
    sortByPriority(receiveTypes);
    console.log(receiveTypes[0].type);
  }
  for(var i=0; i<receiveTypes.length; i++){
    if(receiveTypes[i].supply > 0){
        await Type.updateOne({type: receiveTypes[i].type}, {quantity: receiveTypes[i].quantity - receiveTypes[i].supply}).exec();
    }
  }
  res.render("bloodList",{blood_list: receiveTypes, notEnoughFlag: notEnoughUnits});
});

app.post("/Emergency",async function(req,res){
  var unitsToSupply = parseInt(req.body.bloodAmount);
  var notEnoughUnits = "hidden";
  const oMinus = await Type.findOne({type: "O-"}).lean().exec();
  oMinus.supply = 0;
  if(oMinus.quantity < unitsToSupply){
    unitsToSupply = oMinus.quantity;
    notEnoughUnits = "visible";
  }
  oMinus.supply = unitsToSupply;
  await Type.updateOne({type:"O-"},{quantity: oMinus.quantity - unitsToSupply}).exec();
  res.render("bloodList",{blood_list: [oMinus], notEnoughFlag: notEnoughUnits})
});

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

function sortByPriority(bloodTypesArray){
  bloodTypesArray.sort(function(type1,type2){
    return  priority(type2) - priority(type1);
  });
}

function priority(type){
  return ((type.quantity-type.supply)*type.common) / type.donate.length;
}
// app.post("/giveBlood",function(req,res) {
//   // const bloodUnits_Aplus = parseInt(req.body.Aplus);
//   // const bloodUnits_Bplus = parseInt(req.body.Bplus);
//   // const bloodUnits_ABplus = parseInt(req.body.ABplus);
//   // const bloodUnits_Oplus = parseInt(req.body.Oplus);
//   // const oldQuantity_Aplus = await Type.findOne({type: "A+"}, 'quantity -_id').exec();
//   // const oldQuantity_Bplus = await Type.findOne({type: "B+"}, 'quantity -_id').exec();
//   // const oldQuantity_ABplus = await Type.findOne({type: "AB+"}, 'quantity -_id').exec();
//   // const oldQuantity_Oplus = await Type.findOne({type: "O+"}, 'quantity -_id').exec();
//   // await Type.findOneAndUpdate({type: "A+"}, {quantity: oldQuantity_Aplus.quantity - bloodUnits_Aplus}).exec();
//   // await Type.findOneAndUpdate({type: "B+"}, {quantity: oldQuantity_Bplus.quantity - bloodUnits_Bplus}).exec();
//   // await Type.findOneAndUpdate({type: "AB+"}, {quantity: oldQuantity_ABplus.quantity - bloodUnits_ABplus}).exec();
//   // await Type.findOneAndUpdate({type: "O+"}, {quantity: oldQuantity_Oplus.quantity - bloodUnits_Oplus}).exec();

//   // const updatedBlood = await Type.find({}).exec();
//   // res.render("recept_normal",{blood: updatedBlood});

// });






app.listen(3000, function() {
  console.log("Server started on port 3000");
});
