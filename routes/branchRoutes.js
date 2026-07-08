const express = require("express");
const router = express.Router();
const {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/branchController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

router.use(protect, authorize(ROLES.ADMIN));

router.route("/").post(createBranch).get(getBranches);
router.route("/:id").get(getBranch).put(updateBranch).delete(deleteBranch);

module.exports = router;
