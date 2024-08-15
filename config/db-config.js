const mongoose = require("mongoose");
const dbConfiguration = async() => {
  try {
    // for development, please create .env file under the root and add MONGODB_URI=CONNECTION_STRING
    const MONGODB_URI = process?.env?.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to the atlas cloud."); 
  } catch(error) {
    console.error("Could not connect to the atlas cloud. ", error);
  }
}
dbConfiguration();