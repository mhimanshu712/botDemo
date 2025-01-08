const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";;
const genAI = new GoogleGenerativeAI(apiKey);

const recordUserInfoFunctionDeclaration = {
  name: "recordUserInfo",
  parameters: {
    type: "OBJECT",
    description: "Record a user's name and email address.",
    properties: {
      name: {
        type: "STRING",
        description: "The user's full name",
      },
      email: {
        type: "STRING",
        description: "The user's email address",
      }
    },
    required: ["name", "email"],
  },
};

// Executable function code. Put it in a map keyed by the function name
// so that you can call it once you get the name string from the model.
const functions = {
  recordUserInfo: ({ name, email }) => {
    return collectUserInfo(name, email)
  }
};

function collectUserInfo(name, email) {
  console.log(`Collected user info - Name: ${name}, Email: ${email}`);
  return {
    name: name,
    email: email
  };
}

const systemInstructionOld = "You are an AI assistant for Ads Local, a premier ads marketing business dedicated to helping clients grow their online presence and reach their target audience effectively.\n\nYour Responsibilities:\nIntroduction:\n\nGreet the customer warmly.\nIntroduce Ads Local and briefly explain our mission to support businesses through effective advertising and digital solutions.\nExplain Services:\n\nAd Creation and Management:\nDescribe how Ads Local creates tailored advertising campaigns across various platforms (e.g., Google Ads, Facebook, Instagram).\nHighlight our expertise in targeting, budgeting, and optimizing ads for maximum ROI.\nWebsite Development:\nExplain our capability to design and develop professional, responsive websites that are user-friendly and optimized for search engines.\nMention any specialties, such as e-commerce sites, landing pages, or custom web applications.\nChatbot Creation:\nOutline how Ads Local builds intelligent chatbots to enhance customer engagement, provide 24/7 support, and streamline communication on websites and social media platforms.\nEngage the Customer:\n\nAsk open-ended questions to understand the customer's specific needs and goals.\nProvide tailored recommendations based on their responses.\nCall to Action:\n\nIf the customer expresses interest in any of the services, guide them towards the next steps.\nPolitely request their Name and Email Address to provide more detailed information, a personalized quote, or to schedule a consultation.\nClosing:\n\nThank the customer for their time.\nAssure them of Ads Local's commitment to helping their business succeed.\nImportant Instructions:\nContext Restriction:\n\nOnly respond to queries directly related to Ads Local, its services, or how we can assist the customer.\nPolitely decline to answer any questions or engage in topics unrelated to Ads Local's business scope. Use a response such as: \"I'm here to assist with anything related to Ads Local and our services. Please let me know how I can help!\"\nTone:\n\nMaintain a friendly, professional, and approachable tone.\nClarity:\n\nCommunicate services clearly without using overly technical jargon.\nResponsiveness:\n\nAdapt to the customer's level of understanding and respond to their queries effectively.\nPrivacy:\n\nAssure customers that their information will be kept confidential and used solely for providing them with the best possible service.\nExample Interaction:\n\nAssistant: \"Hello! Welcome to Ads Local. We're here to help your business thrive with our expert advertising campaigns, website development, and chatbot solutions. How can we assist you today?\"\n\nCustomer: \"I'm interested in improving my online advertising.\"\n\nAssistant: \"That's great to hear! At Ads Local, we specialize in creating and managing effective ad campaigns tailored to your target audience. Would you like to learn more about our services? If so, could I have your name and email address to send you detailed information?\"\n\nCustomer: \"By the way, can you tell me how to bake a cake?\"\n\nAssistant: \"I'm here to assist with anything related to Ads Local and our services. Let me know how I can help with your advertising, website, or chatbot needs!\"";
const systemInstruction = "You are an AI assistant for Ads Local, a premier ads marketing business dedicated to helping clients grow their online presence and reach their target audience effectively. Ads local provides services like vido ad creation, chatbot cration and website creation. Give brief info about the company, and a little more if asked. but You are primarly achatbot designed to collect only the user's name and email address.\n\nStart by politely asking the user for their name.\nOnce the name is provided, thank the user and ask for their email address.\nRecord the name and email address.\nPolitely end the interaction after confirming the details.\nDo not engage in any other conversations or respond to unrelated queries except for explaining about adslocal in brief.\nExample Flow:\n\nChatbot: \"Hello! I am ads local bot, May I please have your name?\"\nUser: \"John Doe\"\nChatbot: \"Thank you, John. Could you also share your email address?\"\nUser: \"john.doe@example.com\"\nChatbot: \"Thank you for providing your details. Have a great day!\"";
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
  tools: {
    functionDeclarations: [recordUserInfoFunctionDeclaration],
  }
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: []
  });

  const result = await chatSession.sendMessage("hello");
  console.log(result.response.text());
  const shouldCall = result.response.functionCalls();
  console.log(result.response.functionCalls());

  if (shouldCall) {
    const call = result.response.functionCalls()[0];
    // Call the executable function named in the function call
    // with the arguments specified in the function call and
    // let it call the hypothetical API.
    const apiResponse = await functions[call.name](call.args);

    // Send the API response back to the model so it can generate
    // a text response that can be displayed to the user.
    const result2 = await chatSession.sendMessage([{
      functionResponse: {
        name: 'recordUserInfo',
        response: apiResponse
      }
    }]);

    // Log the text response.
    console.log(result2.response.text());
  }
}

run();
// Create HTML file with chat interface
const fs = require('fs');

// Create Express server to serve HTML and handle chat
const express = require('express');
const app = express();
app.use(express.json());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle chat messages
app.post('/chat', async (req, res) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: req.body.history
    });
    var result = await chatSession.sendMessage(req.body.message);

    const shouldCall = result.response.functionCalls();
    //console.log(result.response.functionCalls());

    if (shouldCall) {
      const call = result.response.functionCalls()[0];
      // Call the executable function named in the function call
      // with the arguments specified in the function call and
      // let it call the hypothetical API.
      const apiResponse = await functions[call.name](call.args);

      // Send the API response back to the model so it can generate
      // a text response that can be displayed to the user.
      const result2 = await chatSession.sendMessage([{
        functionResponse: {
          name: 'recordUserInfo',
          response: apiResponse
        }
      }]);

      // Log the text response.
      console.log(result2.response.text());
      result = result2;
    }
    const response = result.response.text();
    console.log("*************");
    console.log(response);
    // Return both the response and updated history
    res.json({
      response,
      history: [...(req.body.history || []),
      { role: "user", parts: [{ text: req.body.message }] },
      { role: "model", parts: [{ text: response }] }
      ]
    });
  } catch (error) {
    console.error('Error:', error);
    res.json({ response: "I apologize, but I encountered an error processing your message. Please try again." });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to start chatting`);
});