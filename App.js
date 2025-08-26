const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");

// MODELS
const Listing = require("./models/listing");
const Review = require("./models/review");

// -------------------- DB CONNECT --------------------
mongoose.connect("mongodb://127.0.0.1:27017/wanderlust")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// -------------------- APP CONFIG --------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// -------------------- ROUTES --------------------

// Home
app.get("/", (req, res) => {
  res.send("Home Page");
});

// Show all listings
app.get("/listings", async (req, res) => {
  let listings = await Listing.find({});
  res.render("listings/index", { listings });
});

// New Listing form
app.get("/listings/new", (req, res) => {
  res.render("listings/new");
});

// Create Listing
app.post("/listings", async (req, res) => {
  let newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect(`/listings/${newListing._id}`);
});

// Show Listing (populate reviews + owner)
app.get("/listings/:id", async (req, res) => {
  let listing = await Listing.findById(req.params.id)
    .populate("reviews")
    .populate("owner");
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("listings/show", { listing });
});

// Edit Listing form
app.get("/listings/:id/edit", async (req, res) => {
  let listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("listings/edit", { listing });
});

// Update Listing
app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  let updatedListing = await Listing.findByIdAndUpdate(
    id,
    req.body.listing,
    { new: true }
  );
  res.redirect(`/listings/${updatedListing._id}`);
});

// Delete Listing
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log("🗑️ Deleted:", deletedListing);
  res.redirect("/listings");
});

// -------------------- REVIEW ROUTES --------------------

// Create Review
app.post("/listings/:id/reviews", async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  console.log("✅ New review saved");
  res.redirect(`/listings/${listing._id}`);
});

// -------------------- ERROR HANDLING --------------------

// Error handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).send(message);
});

// -------------------- SERVER --------------------
app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
