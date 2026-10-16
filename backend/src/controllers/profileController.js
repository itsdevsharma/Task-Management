import User from '../models/User.js';

export const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user.toJSON() });
};

export const updateProfile = async (req, res, next) => {
  try {
    const limits = { name: 100, email: 254, phone: 30, location: 120, jobTitle: 120, bio: 600 };
    const updates = {};
    for (const [field, max] of Object.entries(limits)) {
      if (req.body[field] === undefined) continue;
      if (typeof req.body[field] !== 'string' || req.body[field].trim().length > max) {
        return res.status(400).json({ success: false, message: `${field} must be text with at most ${max} characters` });
      }
      updates[field] = req.body[field].trim();
    }
    if (updates.name !== undefined && updates.name.length < 2) return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
    if (updates.email !== undefined) {
      updates.email = updates.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user.toJSON(), message: 'Profile updated successfully' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already registered' });
    return next(error);
  }
};
