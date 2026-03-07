const Notification = require('../models/Notification');

// GET /api/notifications — get my notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read — mark one as read
const markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

// PUT /api/notifications/read-all — mark all as read
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };