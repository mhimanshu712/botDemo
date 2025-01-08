const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const express = require('express');

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";;
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = "You are an AI assistant for Ads Local, a premier ads marketing business dedicated to helping clients grow their online presence and reach their target audience effectively.\n\nYour Responsibilities:\nIntroduction:\n\nGreet the customer warmly.\nIntroduce Ads Local and briefly explain our mission to support businesses through effective advertising and digital solutions.\nExplain Services:\n\nAd Creation and Management:\nDescribe how Ads Local creates tailored advertising campaigns across various platforms (e.g., Google Ads, Facebook, Instagram).\nHighlight our expertise in targeting, budgeting, and optimizing ads for maximum ROI.\nWebsite Development:\nExplain our capability to design and develop professional, responsive websites that are user-friendly and optimized for search engines.\nMention any specialties, such as e-commerce sites, landing pages, or custom web applications.\nChatbot Creation:\nOutline how Ads Local builds intelligent chatbots to enhance customer engagement, provide 24/7 support, and streamline communication on websites and social media platforms.\nEngage the Customer:\n\nAsk open-ended questions to understand the customer's specific needs and goals.\nProvide tailored recommendations based on their responses.\nCall to Action:\n\nIf the customer expresses interest in any of the services, guide them towards the next steps.\nPolitely request their Name and Email Address to provide more detailed information, a personalized quote, or to schedule a consultation.\nClosing:\n\nThank the customer for their time.\nAssure them of Ads Local's commitment to helping their business succeed.\nImportant Instructions:\nContext Restriction:\n\nOnly respond to queries directly related to Ads Local, its services, or how we can assist the customer.\nPolitely decline to answer any questions or engage in topics unrelated to Ads Local's business scope. Use a response such as: \"I'm here to assist with anything related to Ads Local and our services. Please let me know how I can help!\"\nTone:\n\nMaintain a friendly, professional, and approachable tone.\nClarity:\n\nCommunicate services clearly without using overly technical jargon.\nResponsiveness:\n\nAdapt to the customer's level of understanding and respond to their queries effectively.\nPrivacy:\n\nAssure customers that their information will be kept confidential and used solely for providing them with the best possible service.\nExample Interaction:\n\nAssistant: \"Hello! Welcome to Ads Local. We're here to help your business thrive with our expert advertising campaigns, website development, and chatbot solutions. How can we assist you today?\"\n\nCustomer: \"I'm interested in improving my online advertising.\"\n\nAssistant: \"That's great to hear! At Ads Local, we specialize in creating and managing effective ad campaigns tailored to your target audience. Would you like to learn more about our services? If so, could I have your name and email address to send you detailed information?\"\n\nCustomer: \"By the way, can you tell me how to bake a cake?\"\n\nAssistant: \"I'm here to assist with anything related to Ads Local and our services. Let me know how I can help with your advertising, website, or chatbot needs!\"";

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-pro",
  apiKey: "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw",
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
});

// Create chat prompt template with system message
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemInstruction],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// Create HTML file with chat interface
const fs = require('fs');

// Create Express server to serve HTML and handle chat
const app = express();
app.use(express.json());

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Add function definitions
const availableFunctions = {
  collectUserInfo: {
    name: "collectUserInfo",
    description: "Collect user's contact information when they express interest in services",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "User's full name"
        },
        email: {
          type: "string",
          description: "User's email address"
        },
        interestedService: {
          type: "string",
          description: "Service the user is interested in (advertising, website, chatbot)",
          enum: ["advertising", "website", "chatbot"]
        }
      },
      required: ["name", "email", "interestedService"]
    }
  }
};

// Function implementation
function collectUserInfo(name, email, interestedService) {
  // In a real application, you would save this to a database
  console.log(`New lead collected:
    Name: ${name}
    Email: ${email}
    Interested in: ${interestedService}`);
  return `Thank you ${name}! We've recorded your interest in our ${interestedService} services. We'll send more information to ${email} shortly.`;
}

// Handle chat messages
app.post('/chat', async (req, res) => {
    try {
        const chain = chatPrompt.pipe(model);
        
        const response = await chain.invoke({
            history: req.body.history || [],
            input: req.body.message
        });

        // Check if the response indicates need for collecting user info
        const needsUserInfo = response.content.toLowerCase().includes("could i have your name and email");
        
        let finalResponse = response.content;
        if (needsUserInfo) {
            // In a real implementation, you would parse the user's response
            // This is a simplified example
            const userInfo = {
                name: req.body.message.match(/name:?\s*([^\n,]+)/i)?.[1],
                email: req.body.message.match(/email:?\s*([^\s,]+)/i)?.[1],
                interestedService: req.body.message.toLowerCase().includes("advertising") ? "advertising" :
                                 req.body.message.toLowerCase().includes("website") ? "website" :
                                 req.body.message.toLowerCase().includes("chatbot") ? "chatbot" : null
            };

            if (userInfo.name && userInfo.email && userInfo.interestedService) {
                finalResponse = collectUserInfo(
                    userInfo.name,
                    userInfo.email,
                    userInfo.interestedService
                );
            }
        }

        res.json({ 
            response: finalResponse,
            history: [...(req.body.history || []), 
                {role: "user", content: req.body.message},
                {role: "assistant", content: finalResponse}
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