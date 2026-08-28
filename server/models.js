import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  severity: String,
  area: String,
  state: String,
  district: String,
  lat: Number,
  lng: Number,
  radius: Number,
  targetMode: String,
  issuedAt: Number,
  expiresAt: Number,
  source: String
});

const snapshotSchema = new mongoose.Schema({
  id: String,
  location: String,
  lat: Number,
  lng: Number,
  snapshotDate: String,
  forecastDate: String,
  predictedMaxTemp: Number,
  predictedPrecipProb: Number,
  actualMaxTemp: Number,
  actualPrecip: Number,
  verified: { type: Boolean, default: false },
  accuracyScore: Number,
  timestamp: Number
});

const accuracyLogSchema = new mongoose.Schema({
  location: String,
  date: String,
  predictedTemp: Number,
  actualTemp: Number,
  predictedRainProb: Number,
  actualRainProb: Number,
  tempDiff: Number,
  accuracyStatus: String,
  isSample: Boolean
});

const sosSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  phone: { type: String, default: '' },
  message: { type: String, default: '' },
  helpType: { type: String, default: 'General Emergency' },
  image: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'dispatched', 'resolved'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

export const Alert = mongoose.model('Alert', alertSchema);
export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
export const AccuracyLog = mongoose.model('AccuracyLog', accuracyLogSchema);
export const SosRequest = mongoose.model('SosRequest', sosSchema);
