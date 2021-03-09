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




const bloodSchema = {
  type: String,
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

const a_plus = new Type({type: "A+", quantity: 5});
const b_plus = new Type({type: "B+", quantity: 5});
const ab_plus = new Type({type: "AB+", quantity: 5});
const o_plus = new Type({type: "O+", quantity: 5});
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
        res.render("recept_normal",{});
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/addBlood", function(req,res){
  const bloodUnits_Aplus = parseInt(req.body.Aplus);
  const bloodUnits_Bplus = parseInt(req.body.Bplus);
  const bloodUnits_ABplus = parseInt(req.body.ABplus);
  const bloodUnits_Oplus = parseInt(req.body.Oplus);
  Type.findOne({type: "A+"}, function(err,foundItem){
    if(!err){
      Type.updateOne({_id: foundItem._id}, {quantity: parseInt(foundItem.quantity) + bloodUnits_Aplus},function(err){
        if(!err){
          console.log("updated");
          res.render("recept_normal",{});
        } else {
          console.log(err);
        }
      });
    }
  });
})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
