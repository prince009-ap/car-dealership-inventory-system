const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";

// 1. Mock cloudinary
const cloudinary = require("cloudinary").v2;
jest.mock("cloudinary", () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        destroy: jest.fn().mockResolvedValue({ result: "ok" })
      }
    }
  };
});

// 2. Mock multer-storage-cloudinary to simulate a Cloudinary upload
jest.mock("multer-storage-cloudinary", () => {
  return {
    CloudinaryStorage: jest.fn().mockImplementation(() => {
      return {
        _handleFile: (req, file, cb) => {
          // Drain the stream to avoid request timeout/hangs
          file.stream.resume();

          if (file.originalname.endsWith(".pdf")) {
            return cb(new Error("Error: File upload only supports images (jpg, jpeg, png, webp)"));
          }
          cb(null, {
            path: "https://res.cloudinary.com/dummy/image/upload/v12345/carhub_vehicles/fake_id.png",
            filename: "carhub_vehicles/fake_id"
          });
        },
        _removeFile: (req, file, cb) => {
          cb(null);
        }
      };
    })
  };
});

const app = require("../../app");
const vehicleService = require("../../services/vehicle.service");

const adminToken = jwt.sign(
  {
    userId: "admin-id-1",
    email: "admin@example.com",
    role: "ADMIN"
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

const adminHeader = `Bearer ${adminToken}`;

describe("Vehicle Image Upload and Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/vehicles/upload", () => {
    it("should upload image successfully to Cloudinary", async () => {
      const response = await request(app)
        .post("/api/vehicles/upload")
        .set("Authorization", adminHeader)
        .attach("image", Buffer.from("dummy content"), "test_car.png");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.url).toBe("https://res.cloudinary.com/dummy/image/upload/v12345/carhub_vehicles/fake_id.png");
      expect(response.body.publicId).toBe("carhub_vehicles/fake_id");
    });

    it("should fail validation if file format is unsupported", async () => {
      const response = await request(app)
        .post("/api/vehicles/upload")
        .set("Authorization", adminHeader)
        .attach("image", Buffer.from("dummy content"), "test_file.pdf");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("only supports images");
    });

    it("should fail validation if no image is attached", async () => {
      const response = await request(app)
        .post("/api/vehicles/upload")
        .set("Authorization", adminHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("upload an image file");
    });
  });

  describe("Cloudinary Destroy Integration", () => {
    let vehicleId;

    beforeEach(async () => {
      const vehicle = await vehicleService.createVehicle({
        make: "Tesla",
        model: "Model S",
        category: "Electric",
        price: 90000,
        quantity: 3,
        imageUrl: "https://res.cloudinary.com/dummy/image/upload/fake_id.png",
        imagePublicId: "carhub_vehicles/fake_id"
      });
      vehicleId = vehicle._id;
    });

    it("should destroy the old image on Cloudinary when updating to a new image", async () => {
      await vehicleService.updateVehicle(vehicleId, {
        make: "Tesla",
        model: "Model S",
        category: "Electric",
        price: 95000,
        quantity: 3,
        imageUrl: "https://res.cloudinary.com/dummy/image/upload/new_fake_id.png",
        imagePublicId: "carhub_vehicles/new_fake_id"
      });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("carhub_vehicles/fake_id");
    });

    it("should NOT destroy the image on Cloudinary when updating without changing the image", async () => {
      await vehicleService.updateVehicle(vehicleId, {
        price: 96000
      });

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it("should destroy the image on Cloudinary when deleting the vehicle", async () => {
      await vehicleService.deleteVehicle(vehicleId);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("carhub_vehicles/fake_id");
    });
  });
});
