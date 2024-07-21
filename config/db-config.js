const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://<username>:<password>@cluster0.p5xlgf9.mongodb.net/<DB_NAME>?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
  console.log("Connected to Database.");        
})
.catch((error) => {
  console.log("Could not connect to Database.", error);
});     