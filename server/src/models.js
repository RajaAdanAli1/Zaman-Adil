import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    heading: String,
    paragraphs: [String],
  },
  { _id: false }
);

const altSchema = new mongoose.Schema(
  {
    lang: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    summary: { type: String, default: "" },
    citation: { type: String, default: "" },
    paragraphs: { type: [String], default: [] },
    sections: { type: [sectionSchema], default: [] },
  },
  { _id: false }
);

const publicationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    authors: { type: String, required: true },
    year: { type: Number, required: true },
    venue: { type: String, default: "" },
    type: { type: String, default: "Journal Article" },
    volume: { type: String, default: "" },
    issue: { type: String, default: "" },
    pages: { type: String, default: "" },
    doi: { type: String, default: "" },
    url: { type: String, default: "" },
    pdf: { type: String, default: "" },
    summary: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    lang: { type: String, default: "en" },
    alt: { type: altSchema, default: () => ({}) },
  },
  { timestamps: true }
);
publicationSchema.index({ year: -1, title: 1 });
publicationSchema.index({ featured: 1, year: -1 });

const articleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["review", "opinion"], required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    date: { type: String, required: true },
    category: { type: String, default: "" },
    image: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
    author: { type: String, default: "Dr. Adil Zaman" },
    lang: { type: String, default: "en" },
    citation: { type: String, default: "" },
    doi: { type: String, default: "" },
    paragraphs: { type: [String], default: [] },
    sections: { type: [sectionSchema], default: [] },
    alt: { type: altSchema, default: () => ({}) },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);
articleSchema.index({ kind: 1, published: 1, date: -1 });
articleSchema.index({ published: 1, slug: 1 });

const messageSchema = new mongoose.Schema({
  name: { type: String, maxlength: 120 },
  email: { type: String, maxlength: 180 },
  organisation: { type: String, default: "", maxlength: 180 },
  country: { type: String, default: "", maxlength: 80 },
  enquiry: { type: String, maxlength: 80 },
  subject: { type: String, maxlength: 180 },
  message: { type: String, maxlength: 5000 },
  ipHash: { type: String, default: "", maxlength: 64 },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1, createdAt: -1 });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, maxlength: 80 },
  passwordHash: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0 },
});

const pageviewSchema = new mongoose.Schema({
  path: { type: String, required: true },
  day: { type: String, required: true },
  views: { type: Number, default: 0 },
});
pageviewSchema.index({ path: 1, day: 1 }, { unique: true });

export const Publication = mongoose.model("Publication", publicationSchema);
export const Article = mongoose.model("Article", articleSchema);
export const Message = mongoose.model("Message", messageSchema);
export const User = mongoose.model("User", userSchema);
export const Pageview = mongoose.model("Pageview", pageviewSchema);
