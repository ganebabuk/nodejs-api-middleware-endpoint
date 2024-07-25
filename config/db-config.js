const mongoose = require("mongoose");
const dbConfiguration = async() => {
  try {
    await mongoose.connect("mongodb+srv://<username>:<password>@cluster0.p5xlgf9.mongodb.net/<db_name>?retryWrites=true&w=majority&appName=<cluster_name>");
    console.log("Connected to the atlas cloud."); 
  } catch(error) {
    console.error("Could not connect to the atlas cloud. ", error);
  }
}
dbConfiguration();