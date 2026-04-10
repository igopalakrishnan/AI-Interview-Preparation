const axios = require("axios");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utilis/prompts");
const { parse: dirtyParse } = require("dirty-json");

//@desc Generate interview questions and answers using Gemini
//@route POST /api/generate-questions
//@access Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions, model } =
      req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Default to LLaMA if no model provided
    const chosenModel = model || "meta-llama/llama-3-70b-instruct";

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions,
    );

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: chosenModel,
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a valid JSON array of objects with keys 'question' and 'answer'. No text outside the JSON. No comments. No typos. No code fences.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      console.error("Unexpected response:", response.data);
      return res.status(500).json({ message: "Model did not return choices" });
    }

    const rawText = response.data.choices[0].message.content;
    console.log("Raw:", rawText);

    // Strip code fences, don’t escape newlines
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    let safeQuestions = [];
    let success = true;

    try {
      // Use tolerant parser
      let parsedData = dirtyParse(cleanedText);

      if (Array.isArray(parsedData)) {
        // Sanitize: only keep valid question/answer pairs
        safeQuestions = parsedData.filter(
          (q) =>
            q && typeof q.question === "string" && typeof q.answer === "string",
        );
      } else {
        success = false;
      }
    } catch (err) {
      console.error("Parsing error:", err.message);
      success = false;
    }

    res.status(200).json({
      success,
      questions: safeQuestions,
      error: success ? null : "Invalid JSON from model",
      raw: success ? null : rawText,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    if (error.code === "ETIMEDOUT") {
      return res
        .status(504)
        .json({ message: "Request timed out, please try again." });
    }
    res.status(500).json({ message: "failed to generate questions" });
  }
};

//@desc Generate explanation for an interview question
//@route POST /api/generate-explanation
//@access Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = conceptExplainPrompt(question);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-70b-instruct",
        messages: [
          {
            role: "system",
            content:
              "Return ONLY a valid JSON array of objects with keys 'question' and 'answer'. No text outside the JSON. No comments. No code fences.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      console.error("Unexpected response:", response.data);
      return res.status(500).json({ message: "Model did not return choices" });
    }

    const rawText = response.data.choices[0].message.content;
    console.log("Raw model output:", rawText);

    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    let parsedData = [];
    let success = true;

    try {
      parsedData = dirtyParse(cleanedText);

      // If model returned a single object instead of an array
      if (parsedData && !Array.isArray(parsedData)) {
        parsedData = [parsedData];
      }

      // Handle nested string outputs
      if (parsedData.output && typeof parsedData.output === "string") {
        parsedData = dirtyParse(parsedData.output.trim());
        if (parsedData && !Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }
      }

      if (typeof parsedData === "string") {
        parsedData = dirtyParse(parsedData.trim());
        if (parsedData && !Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }
      }
    } catch (err) {
      console.error("Parsing error:", err.message);
      success = false;
      parsedData = [];
    }

    res.status(200).json({
      success,
      questions: Array.isArray(parsedData) ? parsedData : [],
      explanation:
        Array.isArray(parsedData) && parsedData[0]?.answer?.explanation
          ? parsedData[0].answer.explanation
          : null,
      error: success ? null : "Invalid JSON from model",
      raw: success ? null : rawText,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "failed to generate questions" });
  }
};

module.exports = { generateConceptExplanation, generateInterviewQuestions };
