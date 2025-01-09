const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');

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

// Add your Firebase configuration (get this from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCpcfY_2o_nIfIHpwg1nbL8BrkvpnlrMEU",
  authDomain: "adslocal-87bc1.firebaseapp.com",
  databaseURL: "https://adslocal-87bc1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adslocal-87bc1",
  storageBucket: "adslocal-87bc1.firebasestorage.app",
  messagingSenderId: "795593459799",
  appId: "1:795593459799:web:92c5443d917fcb9c5d3b12",
  measurementId: "G-N9FFFCJD4L"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Update the collectUserInfo function to store data in Firestore
async function collectUserInfo(name, email) {
  console.log(`Collected user info - Name: ${name}, Email: ${email}`);

  try {
    // Add user info to Firestore
    const docRef = await addDoc(collection(db, "users"), {
      name: name,
      email: email,
      timestamp: new Date()
    });
    console.log("Document written with ID: ", docRef.id);

    return {
      name: name,
      email: email,
      status: "success"
    };
  } catch (error) {
    console.error("Error adding document: ", error);
    return {
      name: name,
      email: email,
      status: "error",
      error: error.message
    };
  }
}

const systemInstructionOld = "You are an AI assistant for Ads Local, a premier ads marketing business dedicated to helping clients grow their online presence and reach their target audience effectively.\n\nYour Responsibilities:\nIntroduction:\n\nGreet the customer warmly.\nIntroduce Ads Local and briefly explain our mission to support businesses through effective advertising and digital solutions.\nExplain Services:\n\nAd Creation and Management:\nDescribe how Ads Local creates tailored advertising campaigns across various platforms (e.g., Google Ads, Facebook, Instagram).\nHighlight our expertise in targeting, budgeting, and optimizing ads for maximum ROI.\nWebsite Development:\nExplain our capability to design and develop professional, responsive websites that are user-friendly and optimized for search engines.\nMention any specialties, such as e-commerce sites, landing pages, or custom web applications.\nChatbot Creation:\nOutline how Ads Local builds intelligent chatbots to enhance customer engagement, provide 24/7 support, and streamline communication on websites and social media platforms.\nEngage the Customer:\n\nAsk open-ended questions to understand the customer's specific needs and goals.\nProvide tailored recommendations based on their responses.\nCall to Action:\n\nIf the customer expresses interest in any of the services, guide them towards the next steps.\nPolitely request their Name and Email Address to provide more detailed information, a personalized quote, or to schedule a consultation.\nClosing:\n\nThank the customer for their time.\nAssure them of Ads Local's commitment to helping their business succeed.\nImportant Instructions:\nContext Restriction:\n\nOnly respond to queries directly related to Ads Local, its services, or how we can assist the customer.\nPolitely decline to answer any questions or engage in topics unrelated to Ads Local's business scope. Use a response such as: \"I'm here to assist with anything related to Ads Local and our services. Please let me know how I can help!\"\nTone:\n\nMaintain a friendly, professional, and approachable tone.\nClarity:\n\nCommunicate services clearly without using overly technical jargon.\nResponsiveness:\n\nAdapt to the customer's level of understanding and respond to their queries effectively.\nPrivacy:\n\nAssure customers that their information will be kept confidential and used solely for providing them with the best possible service.\nExample Interaction:\n\nAssistant: \"Hello! Welcome to Ads Local. We're here to help your business thrive with our expert advertising campaigns, website development, and chatbot solutions. How can we assist you today?\"\n\nCustomer: \"I'm interested in improving my online advertising.\"\n\nAssistant: \"That's great to hear! At Ads Local, we specialize in creating and managing effective ad campaigns tailored to your target audience. Would you like to learn more about our services? If so, could I have your name and email address to send you detailed information?\"\n\nCustomer: \"By the way, can you tell me how to bake a cake?\"\n\nAssistant: \"I'm here to assist with anything related to Ads Local and our services. Let me know how I can help with your advertising, website, or chatbot needs!\"";
const systemInstruction = "You are an AI assistant for Ads Local, a premier ads marketing business dedicated to helping clients grow their online presence and reach their target audience effectively. Ads local provides services like vido ad creation, chatbot cration and website creation. Give brief info about the company, and a little more if asked. but You are primarly achatbot designed to collect only the user's name and email address.\n\nStart by politely asking the user for their name.\nOnce the name is provided, thank the user and ask for their email address.\nRecord the name and email address.\nPolitely end the interaction after confirming the details.\nDo not engage in any other conversations or respond to unrelated queries except for explaining about adslocal in brief.\nExample Flow:\n\nChatbot: \"Hello! I am ads local bot, May I please have your name?\"\nUser: \"John Doe\"\nChatbot: \"Thank you, John. Could you also share your email address?\"\nUser: \"john.doe@example.com\"\nChatbot: \"Thank you for providing your details. Have a great day!\"";
let model = genAI.getGenerativeModel({
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
  res.sendFile(__dirname + '/models.html');
});

// Update chat route to use chat.html instead of index.html
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
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

// Add new endpoint to get users
app.get('/users', async (req, res) => {
  try {
    const usersQuery = query(collection(db, "users"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.sendFile(__dirname + '/users.html');
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users');
  }
});

// Add endpoint to get users data as JSON
app.get('/api/users', async (req, res) => {
  try {
    const usersQuery = query(collection(db, "users"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert timestamp to string for easier display
      data.timestamp = data.timestamp.toDate().toLocaleString();
      users.push({ id: doc.id, ...data });
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Add this new endpoint before the server start
app.get('/api/updateInstruction/:number', async (req, res) => {
  try {
    const numberParam = req.params.number;
    const modelsQuery = query(collection(db, "models"), where("number", "==", parseInt(numberParam)));
    const querySnapshot = await getDocs(modelsQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'No matching instruction found' });
    }

    // Get the first matching document
    const doc = querySnapshot.docs[0];
    const newInstruction = doc.data().instruction;

    // Create a new model instance and update the global variable
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: newInstruction,
      tools: {
        functionDeclarations: [recordUserInfoFunctionDeclaration],
      }
    });

    res.json({
      message: 'Instruction updated successfully',
      newInstruction: newInstruction
    });
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: 'Error updating instruction' });
  }
});

// Serve the models selection page
app.get('/models', (req, res) => {
  res.sendFile(__dirname + '/models.html');
});

// Add endpoint to get all models
app.get('/api/models', async (req, res) => {
  try {
    const modelsQuery = query(collection(db, "models"), orderBy("number", "asc"));
    const querySnapshot = await getDocs(modelsQuery);
    const models = [];
    querySnapshot.forEach((doc) => {
      models.push(doc.data());
    });
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Error fetching models' });
  }
});

// Add endpoint to get a specific model
app.get('/api/models/:number', async (req, res) => {
  try {
    const numberParam = parseInt(req.params.number);
    const modelsQuery = query(collection(db, "models"), where("number", "==", numberParam));
    const querySnapshot = await getDocs(modelsQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Get the first matching document
    const doc = querySnapshot.docs[0];
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Error fetching model' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to start chatting`);
});