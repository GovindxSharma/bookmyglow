import jwt from "jsonwebtoken";

const getSecret = () => process.env.JWT_SECRET || "bookmyglow_default_jwt_secret_salon_platform_2026";

/**
 * Generate JWT with user details inside
 * @param {Object} user - Mongoose user document
 * @returns {String} token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getSecret(),
    { expiresIn: "7d" }
  );
};
