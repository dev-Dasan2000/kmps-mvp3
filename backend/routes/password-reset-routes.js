import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router()
const SALT_ROUNDS = 10;

const findRoleById = (userID) => {
  if (userID.startsWith("knrsrecep")) return "receptionist";
  if (userID.startsWith("knrsdent")) return "dentist";
  if (userID.startsWith("P")) return "patient";
  if (userID.startsWith("knrslab")) return "lab";
  if (userID.startsWith("knrsradio")) return "radiologist";
  if (userID.startsWith("admin")) return "admin";
  return null;
};

router.post('/', async (req, res) => {
  try {
    const { userID, questions } = req.body;
    const role = findRoleById(userID);

    if (!role) {
      return res.status(400).json({ error: 'Invalid user role.' });
    }

    const storedAnswers = await prisma[`${role}_security_question_answers`].findMany({
      where: {
        [`${role}_id`]: userID
      }
    });

    const isAllCorrect = questions.every(({ security_question_id, answer }) => {
      const stored = storedAnswers.find(q => q.security_question_id === security_question_id);
      return stored && stored.answer === answer;
    });

    if (isAllCorrect) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Answers do not match.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error verifying answers: " + error.message });
  }
});

router.post('/change', async (req, res) => {
  try {
    const { userID, password } = req.body;
    const role = findRoleById(userID);

    if (!role) {
      return res.status(400).json({ error: 'Invalid user role.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    let finalizedRole = role;
    if(role != "lab"){
      finalizedRole = `${role}s`;
    }

    const updatedUser = await prisma[`${finalizedRole}`].update({
      where: {
        [`${role}_id`]: userID
      },
      data: {
        password: hashedPassword
      }
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error Updating Password: " + error.message });
  }
});

export default router;