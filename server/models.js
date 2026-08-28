import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  severity: String,
  area: String,
  issuedAt: Number,
  expiresAt: Number,
  source: String
});

const snapshotSchema = new mongoose.Schema({
  id: String,
  location: String,
  lat: Number,
  lng: Number,
  date: String,
  maxTemp: Number,
  precipProbMax: Number,
  actualMaxTemp: Number,
  actualPrecip: Number,
  verified: { type: Boolean, default: false },
  accuracyScore: Number,
  timestamp: Number
});

const accuracyLogSchema = new mongoose.Schema({
  location: String,
  trackingStartedAt: String,
  data: Array,
  message: String
});

export const Alert = mongoose.model('Alert', alertSchema);
export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
export const AccuracyLog = mongoose.model('AccuracyLog', accuracyLogSchema);
