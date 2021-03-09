const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');


const app = express();

app.set('view engine', 'ejs');


app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect('mongodb://localhost:27017/blogDB', {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb://localhost:27017/becsDB', {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb+srv://admin-nadav:123@cluster0.ohzh4.mongodb.net/becsDB', {useNewUrlParser: true, useUnifiedTopology: true });




const bloodSchema = {
  type: String,
  name: String,
  quantity: Number,
  donate: Array,
  receive: Array
};

const Type = mongoose.model("Type", bloodSchema);

const aPlus = {
  donate: ["A+","AB+"],
  receive: ["A+","A-","O+","O-"]
};

const bPlus = {
  donate: ["B+","AB+"],
  receive: ["B+","O+"]
};

const abPlus = {
  donate: ["AB+"],
  receive: ["A+","B+","AB+","O+"]
  receive: ["A+","B+","AB+","O+","A-","B-","AB-","O-"]
};

const oPlus = {
  donate: ["A+","B+","AB+","O+"],
  receive: ["O+"]
  receive: ["O+","O-"]
};

const a_plus = new Type({type: "A+",name:"Aplus" ,quantity: 5});
const b_plus = new Type({type: "B+",name:"Bplus", quantity: 5});
const ab_plus = new Type({type: "AB+",name:"ABplus", quantity: 5});
const o_plus = new Type({type: "O+",name:"Oplus", quantity: 5});
const bloodTypes = [a_plus,b_plus,ab_plus,o_plus];
const a_plus = new Type({type: "A+",name:"Aplus" ,quantity: 0, donate: ["A+","AB+"], receive: ["A+","A-","O+","O-"]});
const b_plus = new Type({type: "B+",name:"Bplus", quantity: 0, donate: ["B+","AB+"], receive: ["B+","B-","O+","O-"]});
const ab_plus = new Type({type: "AB+",name:"ABplus", quantity: 0, donate: ["AB+"], receive: ["A+","B+","AB+","O+","A-","B-","AB-","O-"]});
const o_plus = new Type({type: "O+",name:"Oplus", quantity: 0, donate: ["A+","B+","AB+","O+"], receive: ["O+","O-"]});
const a_minus = new Type({type: "A-",name:"Aminus" ,quantity: 0, donate: ["A+","A-","AB+","AB-"], receive: ["A-","O-"]});
const b_minus = new Type({type: "B-",name:"Bminus", quantity: 0, donate: ["B+","B-","AB+","AB-"], receive: ["B-","O-"]});
const ab_minus = new Type({type: "AB-",name:"ABminus", quantity: 0, donate: ["AB+","AB-"], receive: ["A-","B-","AB-","O-"]});
const o_minus = new Type({type: "O-",name:"Ominus", quantity: 0, donate: ["A+","B+","AB+","O+","A-","B-","AB-","O-"], receive: ["O-"]});
const bloodTypes = [a_plus,b_plus,ab_plus,o_plus,a_minus,b_minus,ab_minus,o_minus];
Type.insertMany(bloodTypes, function(err,docs){
});


app.get("/", function(req,res){
  res.render("recept_normal",{});
  Type.find({}, function(err,foundItems){
    if(!err){
      if(foundItems.length === 0){
        Type.insertMany(bloodTypes, function(err,docs){
          if(err){
            console.log(err);
          } else {
            Type.save(function(err){
              if(!err){
                console.log("succesfully added items");
              }
            });
          }
        });
      } else {
        res.render("recept_normal",{blood: foundItems});
      }
    } else {
    } 
    else {
      console.log(err);
    }
  });
});

app.post("/addBlood", function(req,res){
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

app.post("/giveBlood", async function(req,res){
  const bloodUnits_Aplus = parseInt(req.body.Aplus);
  const bloodUnits_Bplus = parseInt(req.body.Bplus);
  const bloodUnits_ABplus = parseInt(req.body.ABplus);
  const bloodUnits_Oplus = parseInt(req.body.Oplus);
  const oldQuantity_Aplus = await Type.findOne({type: "A+"}, 'quantity -_id').exec();
  const oldQuantity_Bplus = await Type.findOne({type: "B+"}, 'quantity -_id').exec();
  const oldQuantity_ABplus = await Type.findOne({type: "AB+"}, 'quantity -_id').exec();
  const oldQuantity_Oplus = await Type.findOne({type: "O+"}, 'quantity -_id').exec();
  await Type.findOneAndUpdate({type: "A+"}, {quantity: oldQuantity_Aplus.quantity - bloodUnits_Aplus}).exec();
  await Type.findOneAndUpdate({type: "B+"}, {quantity: oldQuantity_Bplus.quantity - bloodUnits_Bplus}).exec();
  await Type.findOneAndUpdate({type: "AB+"}, {quantity: oldQuantity_ABplus.quantity - bloodUnits_ABplus}).exec();
  await Type.findOneAndUpdate({type: "O+"}, {quantity: oldQuantity_Oplus.quantity - bloodUnits_Oplus}).exec();
  //take the blood type object from database according to what user chose in the combobox
  const requestedBloodType = await Type.findOne({type: req.body.bloodType}).exec();
  //the amount that the user typed in the input
  const requestedAmount = req.body.amount;

  const updatedBlood = await Type.find({}).exec();
  res.render("recept_normal",{blood: updatedBlood});
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
