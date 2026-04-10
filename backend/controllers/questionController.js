const Session = require("../models/Session");
const Question = require("../models/Question");

//@desc Add additional questions to an existing session
//@route POST /api/questions/add
//@access Private
exports.addQuestionsToSession = async (req, res) => {
  try {
    const { sessionId, questions } = req.body;
    console.log("req.body:", req.body);

    if (!sessionId || !questions) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Normalize questions
    let normalizedQuestions = [];
    if (Array.isArray(questions)) {
      normalizedQuestions = questions;
    } else if (typeof questions === "object") {
      normalizedQuestions = [questions];
    } else {
      return res.status(400).json({ message: "Invalid questions format" });
    }

    // Create new questions
    const createdQuestions = await Question.insertMany(
      normalizedQuestions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer,
      })),
    );

    console.log("Type of questions:", typeof questions);
    console.log("Value of questions:", questions);

    // Update session
    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();
    const updatedSession =
      await Session.findById(sessionId).populate("questions");
    res.status(201).json({ success: true, session: updatedSession });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//@desc Pin or unpin a question
//@route POST /api/questions/:id/pin
//@access Private
exports.togglePinQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
    console.error(error.message);
  }
};

//@desc Update a note for a Question
//@route POST /api/questions/:id/note
//@access Private
exports.updateQuestionNote = async (req, res) => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    question.note = note || "";
    await question.save();

    res.status(200).json({ success: true, message: question });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
    console.error(error.message);
  }
};
