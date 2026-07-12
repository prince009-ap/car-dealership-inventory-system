const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const vehicleController = require("../controllers/vehicle.controller");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "carhub_vehicles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});

// Configure Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports images (jpg, jpeg, png, webp)"));
  }
});

const handleUpload = (req, res, next) => {
  console.log("handleUpload - Upload request details:");
  console.log("handleUpload - headers:", req.headers);
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("handleUpload - Multer upload failure:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed"
      });
    }
    console.log("handleUpload - Multer upload success.");
    console.log("handleUpload - req.body parsed:", req.body);
    console.log("handleUpload - req.file metadata:", req.file);
    next();
  });
};

const router = express.Router();

router.use(authMiddleware);

router.post("/upload", authorizeRoles("ADMIN"), handleUpload, vehicleController.uploadImage);
router.post("/", vehicleController.createVehicle);
router.post("/:id/purchase", vehicleController.purchaseVehicle);
router.post("/:id/restock", authorizeRoles("ADMIN"), vehicleController.restockVehicle);
router.get("/search", vehicleController.searchVehicles);
router.get("/", vehicleController.getVehicles);
router.put("/:id", handleUpload, vehicleController.updateVehicle);
router.delete("/:id", authorizeRoles("ADMIN"), vehicleController.deleteVehicle);

module.exports = router;
