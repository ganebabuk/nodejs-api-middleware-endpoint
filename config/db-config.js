const mongoose = require("mongoose");
const connectDB = async() => {
  try {
    await mongoose.connect("mongodb+srv://<user_name>:<password>@cluster0.p5xlgf9.mongodb.net/<db_name>?retryWrites=true&w=majority&appName=Cluster0");
    console.log("Connected to the atlas.");    
  }
  catch(error) {
    console.error("Could not connect to the atlas. Error: ", error);
  }; 
}   
connectDB(); 