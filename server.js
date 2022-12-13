const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")

const app = express();

const PORT = process.env.PORT || 5001

app.use(bodyParser.urlencoded({
  extended : true
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

mongoose.connect("mongodb+srv://afif-admin:pass-admin@cluster0.xkt4s.mongodb.net/?retryWrites=true&w=majority");

//schemas

const userSchema = {
    email : String,
    password : String,
    budget : Number
  };

const expenseSchema = {
    email : String,
    day : Number,
    month : Number,
    year : Number,
    amount : Number,
    category : String
}

const User = mongoose.model("User",userSchema);
const Expense = mongoose.model("Expense",expenseSchema);

//endpoints
app.route('/user')

.post(function(req,res){
    const params = req.query;
    const newUser = new User({
        email : req.query.email,
        password : req.query.password,
        budget : 0,
    })

    User.findOne({email:params.email},function(err,foundUser){
        if(foundUser)
        {
            if(foundUser.password === params.password)
            {
                res.send('success');
            }
            else
            {
                res.send('emailalreadyexists');
            }
        }
        else
        {
            newUser.save(function(err){
                if(!err){
                  res.send('success');
                }
                else
                {
                  res.send('fail');
                  return;
                }
              });
        }
        })


})

.get(function(req,res){
    console.log(req.query);
    const params = req.query;
    User.findOne({email : params.email},function(err,foundUser){
        if(err)
        {
            res.send("error");
        }
        else
        {
            if(foundUser)
            {
                res.send(foundUser);
            }
            else
            {
                res.send('error');
            }
        }
    })
})

app.route('/budget')

.post(function(req,res){
    const params = req.query;
    console.log({email : params.email});
    if(params.action === 'add')
    {
        let newVal = Number(params.amount);
        console.log(newVal);
        User.updateOne({email : params.email},{$set : { "budget": newVal }},function(err){
            if(!err){
              res.send("success");
            }
            else
            {
              res.send(err);
            }});
    }
    else if(params.action === 'sub')
    {
        let newVal = Number(params.budget-params.amount);
        console.log(newVal);
        User.updateOne({email : params.email},{$set : { "budget": newVal }},function(err){
            if(!err){
              const d = new Date();
              const newExpense = new Expense({
                email : params.email,
                day : d.getDate(),
                month : d.getMonth()+1,
                year : d.getFullYear(),
                amount : params.amount,
                category : params.category
              })
              newExpense.save(function(err){
                if(!err){
                  res.send('success');
                }
                else
                {
                  res.send('fail');
                  return;
                }
              });
            }
            else
            {
              res.send(err);
            }});
    }
})

app.route('/expenses')

.get(function(req,res){
    const params = req.query;
    Expense.find({email : params.email},function(err, data) {
        if(err)
        {
            res.send('fail');
        }
        else
        {
            res.send(data);
        }
    })
})

.post(function(req,res){
    const params = req.query;
    Expense.findOne({_id:params._id},function(err,foundExpense){
        if(err)
        {
            res.send('fail');
        }
        else
        {
            const amount = foundExpense.amount;
            console.log(params.email)
            User.findOne({email : params.email},function(err,foundUser){
                if(err)
                {
                    res.send('fail')
                }
                else
                {
                    console.log(foundUser);
                    let newVal = Number(amount)+Number(foundUser.budget);
                    User.updateOne({email : params.email},{$set : { "budget": newVal }},function(err){
                        if(err){
                            res.send('fail');
                        }
                        else
                        {
                            Expense.deleteOne({_id:params._id},function(err){
                                if(err)
                                {
                                    res.send('fail');
                                }
                                else
                                {
                                    console.log(params.email);
                                    res.send('success');
                                }
                            })
                        }
                    })
                }
            })
        }

        })
    })


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});