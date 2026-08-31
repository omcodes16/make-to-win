const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const chatPredictionSchema = new mongoose.Schema({},{ strict: false });
const ChatPrediction = mongoose.models.ChatPrediction || mongoose.model('ChatPrediction', chatPredictionSchema);

async function wipe() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB. Wiping demo data...');
      await ChatPrediction.deleteMany({});
      console.log('MongoDB data wiped successfully.');
      mongoose.disconnect();
    } catch (e) {
      console.error(e);
    }
  }
}
wipe();
