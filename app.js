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
  quantity: Number
};

const Type = mongoose.model("Type", bloodSchema);

const aPlus = {
  donate: ["A+","AB+"],
  receive: ["A+","O+"]
};

const bPlus = {
  donate: ["B+","AB+"],
  receive: ["B+","O+"]
};

const abPlus = {
  donate: ["AB+"],
  receive: ["A+","B+","AB+","O+"]
};

const oPlus = {
  donate: ["A+","B+","AB+","O+"],
  receive: ["O+"]
};

const a_plus = new Type({type: "A+",name:"Aplus" ,quantity: 5});
const b_plus = new Type({type: "B+",name:"Bplus", quantity: 5});
const ab_plus = new Type({type: "AB+",name:"ABplus", quantity: 5});
const o_plus = new Type({type: "O+",name:"Oplus", quantity: 5});
const bloodTypes = [a_plus,b_plus,ab_plus,o_plus];

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
  const oldQuantity_Aplus = await Type.findOne({type: "A+"}, 'quantity -_id').exec();
  const oldQuantity_Bplus = await Type.findOne({type: "B+"}, 'quantity -_id').exec();
  const oldQuantity_ABplus = await Type.findOne({type: "AB+"}, 'quantity -_id').exec();
  const oldQuantity_Oplus = await Type.findOne({type: "O+"}, 'quantity -_id').exec();
  await Type.findOneAndUpdate({type: "A+"}, {quantity: bloodUnits_Aplus + oldQuantity_Aplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "B+"}, {quantity: bloodUnits_Bplus + oldQuantity_Bplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "AB+"}, {quantity: bloodUnits_ABplus + oldQuantity_ABplus.quantity}).exec();
  await Type.findOneAndUpdate({type: "O+"}, {quantity: bloodUnits_Oplus + oldQuantity_Oplus.quantity}).exec();
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
  const updatedBlood = await Type.find({}).exec();
  res.render("recept_normal",{blood: updatedBlood});
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
