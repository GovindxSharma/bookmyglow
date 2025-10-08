import jwt from "jsonwebtoken";

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
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
