//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\controllers\notificationController.js
import TempQuestionFile from '../models/TempQuestionFile.js';
import QuestionFile from '../models/QuestionFile.js';

export const getNotifications = async (req, res) => {
  try {
    const files = await TempQuestionFile.find({});
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

export const acceptQuestionFile = async (req, res) => {
  try {
    const { id, adminEmail } = req.body;
    const file = await TempQuestionFile.findById(id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const newFileName = `${file.fileName}-${adminEmail}.${file.extension || 'xlsx'}`;
    const questionFile = new QuestionFile({
      ...file.toObject(),
      fileName: newFileName,
      approvedBy: adminEmail,
      approvedAt: new Date(),
    });

    await questionFile.save();
    await TempQuestionFile.findByIdAndDelete(id);

    res.json({ message: 'File approved and moved', newFileName });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve file' });
  }
};

export const rejectQuestionFile = async (req, res) => {
  try {
    const { id } = req.body;
    await TempQuestionFile.findByIdAndDelete(id);
    res.json({ message: 'File rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject file' });
  }
};
