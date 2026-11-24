import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  area: { type: String, default: 'Modakkurichi', trim: true },
  available: { type: Boolean, default: true },
  publicListing: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  publicPhotoConsent: { type: Boolean, default: false },
  photo: { type: String, default: '' },
  lastDonation: { type: Date, default: null },
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  patient: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  units: { type: Number, min: 1, default: 1 },
  hospital: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  urgency: { type: String, enum: ['Critical', 'Urgent', 'Routine'], default: 'Urgent' },
  status: { type: String, enum: ['Open', 'In progress', 'Fulfilled', 'Closed'], default: 'Open' },
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  status: { type: String, enum: ['Planning', 'Upcoming', 'Completed', 'Cancelled'], default: 'Upcoming' },
}, { timestamps: true });

const homepageContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'public-homepage' },
  translations: { type: mongoose.Schema.Types.Mixed, required: true },
  groupCounts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  sections: { type: mongoose.Schema.Types.Mixed, default: {} },
  images: { type: mongoose.Schema.Types.Mixed, default: {} },
  phone: { type: String, default: '' },
  contacts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  socials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  siteName: { type: String, default: '' },
  siteSubtitle: { type: String, default: '' },
  region: { type: String, default: '' },
  developerName: { type: String, default: '' },
  developerPhone: { type: String, default: '' },
}, { timestamps: true, minimize: false });

const mediaAssetSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
}, { timestamps: true });

export const Donor = mongoose.models.Donor || mongoose.model('Donor', donorSchema);
export const BloodRequest = mongoose.models.BloodRequest || mongoose.model('BloodRequest', requestSchema);
export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export const HomepageContent = mongoose.models.HomepageContent || mongoose.model('HomepageContent', homepageContentSchema);
export const MediaAsset = mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaAssetSchema);
