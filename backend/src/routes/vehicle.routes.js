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
    cloudinary,
    params: async (req,file)=>({

        folder:"carhub_vehicles",

        resource_type:"image",

        allowed_formats:["jpg","jpeg","png","webp"]

    })
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
  upload.single("image")(req, res, (err) => {
    if (err) {

      console.log("===========UPLOAD ERROR===========");
      console.log(err);
      console.log(err.message);
      console.log(err.stack);

      return res.status(400).json({
        success:false,
        errorType:err.name,
        message:err.message,
        fullError:String(err)
      });
    }

    console.log(req.file);

    next();
  });
};

const router = express.Router();

router.use(authMiddleware);

router.get("/diagnostic", authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const mask = (str) => {
      if (!str) return "NOT_SET";
      if (str.length <= 6) return "*".repeat(str.length);
      return str.slice(0, 3) + "*".repeat(str.length - 6) + str.slice(-3);
    };

    let uploadTest = "Not Started";
    try {
      const result = await cloudinary.uploader.upload("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", {
        folder: "carhub_diagnostic"
      });
      uploadTest = { success: true, publicId: result.public_id };
    } catch (err) {
      uploadTest = { success: false, message: err.message, error: err };
    }

    return res.status(200).json({
      success: true,
      config: {
        CLOUDINARY_CLOUD_NAME: mask(cloudName),
        CLOUDINARY_API_KEY: mask(apiKey),
        CLOUDINARY_API_SECRET: mask(apiSecret),
        rawLengths: {
          cloudName: cloudName ? cloudName.length : 0,
          apiKey: apiKey ? apiKey.length : 0,
          apiSecret: apiSecret ? apiSecret.length : 0
        }
      },
      uploadTest
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post("/upload", authorizeRoles("ADMIN"), handleUpload, vehicleController.uploadImage);
router.post("/", vehicleController.createVehicle);
router.post("/:id/purchase", vehicleController.purchaseVehicle);
router.post("/:id/restock", authorizeRoles("ADMIN"), vehicleController.restockVehicle);
router.get("/search", vehicleController.searchVehicles);
router.get("/", vehicleController.getVehicles);
router.put(
    "/:id",
    authorizeRoles("ADMIN"),
    handleUpload,
    vehicleController.updateVehicle
);
router.delete("/:id", authorizeRoles("ADMIN"), vehicleController.deleteVehicle);

module.exports = router;
