const axios = require("axios");
require("dotenv").config();

async function testPuter() {
  try {
    // ✅ Debug: check if the key is loaded
    console.log("Loaded Puter API Key:", process.env.PUTER_API_KEY);

    const response = await axios.post(
      "https://api.puter.com/v1/chat/completions",
      {
        model: "mistral/mistral-7b-instruct", // ✅ supported model
        messages: [{ role: "user", content: "Hello world" }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testPuter();
