const router = require("express").Router();
const mongoose = require("mongoose");
const c = require("../controllers/alumniController");
const { protect, authorize, requireVerified } = require("../middleware/auth");

router.use(protect);

// Company-wise directory grouping (requires administrator verification)
router.get("/company-directory", requireVerified, c.companyDirectory);

// Year-wise dynamic alumni overview & statistics
router.get("/year-overview", requireVerified, c.yearOverview);

// Imported 2022 alumni dataset query (strictly sanitized, zero phone numbers)
router.get("/imported", requireVerified, async (req, res) => {
  try {
    const AlumniProfile = require("../models/AlumniProfile");
    const docs = await AlumniProfile.find({
      $or: [{ graduationYear: 2022 }, { importBatch: "2022" }, { batch: "2022" }],
      verificationStatus: "verified",
    }).sort({ fullName: 1 }).lean();

    const sanitized = docs.map((d) => c.sanitizeAlumni(d, req.user));

    res.json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    console.error("Imported alumni fetch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch imported alumni data",
    });
  }
});

// Directory & discovery routes (strictly protected from unverified access)
router.get("/search", requireVerified, c.searchAlumni);
router.get("/suggest", requireVerified, c.suggest);
router.get("/filters", requireVerified, c.filters);
router.get("/recommendations", requireVerified, c.getRecommendations);

// Self-profile management (allowed for pending alumni to complete/update profile for review)
router.post("/profile", authorize("alumni"), c.createProfile);
router.put("/profile", authorize("alumni"), c.updateProfile);
router.put("/profile/privacy", authorize("alumni"), c.updatePrivacy);

router.get("/", requireVerified, c.searchAlumni);
router.get("/:id", c.getAlumni);

module.exports = router;
