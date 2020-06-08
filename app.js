//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const app = express();
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'Little secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/blogDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);


const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  creator:String
});

const Post = mongoose.model('Post', postSchema);

const userSchema = new mongoose.Schema({
  name:String,
  email: String,
  password: String,
  post:[postSchema]
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";



app.get('/', function(req, res) {
  res.render('landing');
})
app.get("/home", function(req, res) {

  if (req.isAuthenticated()) {
    Post.find({}, function(err, posts) {
      console.log(posts);
      
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
      });
    })
  } else {
    res.redirect('/login');
  }
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});




app.get("/compose", function(req, res) {

  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect('/login');
  }

});
app.get("/user/:userId",function(req,res){
 const requestedUserId = req.params.userId;
 if (req.isAuthenticated()) {
  User.findById(requestedUserId,function(err,foundUser){
    if(err){
      console.log(err);
    }if(foundUser){
      const userPost = foundUser.post;
      console.log(foundUser);
      
      res.render('user',{user:foundUser.name, posts:userPost});
    }
  })
}
});

app.get("/posts/:postId", function(req, res) {
  const requestedPostId = req.params.postId;
  if (req.isAuthenticated()) {
    Post.findOne({_id: requestedPostId}, function(err, post) {
      if (!err) {
        res.render("post", {
          title: post.title,
          content: post.content
        });
      }
    })
  } else {
    res.redirect('/login');
  }

});



app.post("/compose", function(req, res) {
 
  if(req.isAuthenticated()){
    // console.log(req.user._id);
    // console.log(post._id);
    User.findById(req.user._id,function(err,foundUser){
      const post = new Post({
        title: req.body.postTitle,
        content: req.body.postBody,
        creator: req.user.name
      });
      console.log(post);
     if(err){
       console.log(err);
     }else{
       console.log("Found" + foundUser)
       foundUser.post.push(post);
       foundUser.save(function(err){
         if (err) {
           console.log(err);
         } else {
           post.save();
           res.redirect("/home");
         }
       });

     }
    });
      
  };
});


app.post('/register', function(req, res) {
  User.register({name:req.body.name,username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {

      passport.authenticate('local')(req,res, function(user){
        res.redirect("/user/" + req.user._id);
      });
    }
  });
});

app.post('/login', function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate('local')(req,res, function() {
        res.redirect('/user/' + req.user._id);
      });
    }
  });

});
// -------------------------------------------------------------------------------------------------------------
app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
