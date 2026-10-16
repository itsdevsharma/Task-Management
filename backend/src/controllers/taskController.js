import Task from '../models/Task.js';
import { isValidObjectId, sanitizeSearch } from '../utils/validation.js';

const buildTaskFilters = (userId, query = {}) => {
  const filters = { userId };

  if (query.status) {
    filters.status = query.status;
  }

  if (query.priority) {
    filters.priority = query.priority;
  }

  if (query.search) {
    const safePattern = sanitizeSearch(query.search.trim());
    filters.title = { $regex: safePattern, $options: 'i' };
  }

  return filters;
};

export const getTasks = async (req, res, next) => {
  try {
    const { page: rawPage, limit: rawLimit, status: rawStatus, priority: rawPriority, sortBy: rawSort, order: rawOrder } = req.query;
    const invalid = Object.values(req.query).some(value => typeof value !== 'string') ||
      [rawPage, rawLimit].some(value => value !== undefined && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)) ||
      (rawStatus && !['pending', 'in-progress', 'completed'].includes(rawStatus)) ||
      (rawPriority && !['low', 'medium', 'high'].includes(rawPriority)) ||
      (rawSort && !['createdAt', 'dueDate'].includes(rawSort)) ||
      (rawOrder && !['asc', 'desc'].includes(rawOrder));
    if (invalid) return res.status(400).json({ success: false, message: 'Invalid task query' });
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy === 'dueDate' ? 'dueDate' : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const filters = buildTaskFilters(req.user._id, { status, priority, search });
    const totalTasks = await Task.countDocuments(filters);
    const totalPages = Math.max(1, Math.ceil(totalTasks / limit));

    const tasks = await Task.find(filters)
      .sort({ [sortBy]: order, _id: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        totalTasks,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    if ((title !== undefined && typeof title !== 'string') ||
        (description !== undefined && typeof description !== 'string') ||
        (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid task field type' });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'title', message: 'Title is required' }],
      });
    }

    const safeTask = {
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      status: status === undefined ? 'pending' : status,
      priority: priority === undefined ? 'medium' : priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user._id,
    };

    if (!['pending', 'in-progress', 'completed'].includes(safeTask.status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'status', message: 'Invalid task status' }],
      });
    }

    if (!['low', 'medium', 'high'].includes(safeTask.priority)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'priority', message: 'Invalid task priority' }],
      });
    }

    if (safeTask.dueDate && Number.isNaN(safeTask.dueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'dueDate', message: 'Due date must be a valid date' }],
      });
    }

    const task = await Task.create(safeTask);

    return res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'id', message: 'Invalid task ID' }],
      });
    }

    const task = await Task.findOne({ _id: id, userId: req.user._id }).lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'id', message: 'Invalid task ID' }],
      });
    }

    const allowedUpdates = {};
    const { title, description, status, priority, dueDate } = req.body;
    if ((title !== undefined && typeof title !== 'string') ||
        (description !== undefined && typeof description !== 'string') ||
        (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid task field type' });
    }

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'title', message: 'Title is required' }],
        });
      }
      allowedUpdates.title = String(title).trim();
    }

    if (description !== undefined) {
      allowedUpdates.description = String(description).trim();
    }

    if (status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'status', message: 'Invalid task status' }],
        });
      }
      allowedUpdates.status = status;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'priority', message: 'Invalid task priority' }],
        });
      }
      allowedUpdates.priority = priority;
    }

    if (dueDate !== undefined) {
      const parsedDate = dueDate ? new Date(dueDate) : null;
      if (parsedDate && Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'dueDate', message: 'Due date must be a valid date' }],
        });
      }
      allowedUpdates.dueDate = dueDate ? parsedDate : null;
    }

    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    Object.keys(allowedUpdates).forEach((key) => {
      task[key] = allowedUpdates[key];
    });

    await task.save();

    return res.status(200).json({ success: true, data: task.toObject(), message: 'Task updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'id', message: 'Invalid task ID' }],
      });
    }

    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || { total: 0, pending: 0, inProgress: 0, completed: 0 };
    delete result._id;

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
