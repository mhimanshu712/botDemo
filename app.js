const path = require('path');
const cors = require('cors');
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');
const {
  collectUserInfo,
  storeInMemory,
  getFromMemory,
  userSessionsPersonalData,
  modelFunctions
} = require('./functions'); // Adjust the path to your functions file
const firebaseConfig = require('./firebaseConfig');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const {
  recordUserInfoFunctionDeclaration,
  storeInMemoryFunctionDeclaration,
  getFromMemoryFunctionDeclaration,
} = require('./functionsDefinition');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));
// Enable CORS for all domains
app.use(cors());

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const apiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

llmModelName = "gemini-2.0-flash-exp";

const userSessions = {};

// Executable function code. Put it in a map keyed by the function name
// so that you can call it once you get the name string from the model.

// Add the function declarations to the tools
const tools = {
  functionDeclarations: [
    // recordUserInfoFunctionDeclaration,
    storeInMemoryFunctionDeclaration,
    getFromMemoryFunctionDeclaration
  ]
};

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

// Add new endpoint to get users
app.get('/collectedData', async (req, res) => {
  res.sendFile(__dirname + '/frontend/collectedData.html');
});

app.get('/chat', async (req, res) => {
  res.sendFile(__dirname + '/frontend/chat.html');
});

// Handle chat messages
app.post('/api/chat/:number', async (req, res) => {
  console.log("******new request********");
  try {
    const userId = req.body.userId; // Assume userId is sent in the request
    const modelNumber = req.params.number; // New parameter for model number

    if (!userSessions[userId] || userSessions[userId].modelNumber !== modelNumber) {
      // Fetch the model instruction based on the model number only if the user session does not exist or model number is different
      const modelsQuery = query(collection(db, "models_data"), where("number", "==", parseInt(modelNumber)));
      const querySnapshot = await getDocs(modelsQuery);

      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'No matching instruction found' });
      }

      // Get the first matching document
      const doc = querySnapshot.docs[0];
      const newInstruction = doc.data().instruction;
      const temperature = doc.data().temperature; // Fetch the model temperature

      // Create a new model instance for the user with the fetched instruction
      userSessions[userId] = {
        modelNumber: modelNumber, // Store the current model number
        temperature: temperature, // Store the model temperature
        instance: genAI.getGenerativeModel({
          model: llmModelName,
          systemInstruction: newInstruction, // Use the fetched instruction
          tools: tools
        })
      };
    }
    generationConfig.temperature = userSessions[userId].temperature || 1;
    // console.log("******history******");
    // console.log(req.body.history);
    const chatSession = userSessions[userId].instance.startChat({
      generationConfig,
      history: req.body.history
    });
    var result = await chatSession.sendMessage(req.body.message);

    const shouldCall = result.response.functionCalls();
    console.log("****function calls******");
    console.log(result.response.functionCalls());

    if (shouldCall) {
      const call = result.response.functionCalls()[0];
      // Call the executable function named in the function call
      // with the arguments specified in the function call and
      // let it call the hypothetical API.
      const apiResponse = await modelFunctions[call.name](call.args);

      console.log("*******history before fun call******");
      console.log(req.body.history || []);
      // Send the API response back to the model so it can generate
      // a text response that can be displayed to the user.
      const result2 = await chatSession.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResponse
        }
      }]);
      console.log("*******history after fun call******");
      req.body.history = req.body.history.slice(0, -3);
      console.log(req.body.history || []);
      console.log(req.body.history[req.body.history.length - 1].parts);

      // Log the text response.
      console.log(result2.response.text());
      result = result2;
    }
    const response = result.response.text();
    console.log("*******model response******");
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
    const userId = req.query.userId; // Assume userId is sent as a query parameter

    // Check if the user session exists
    if (userSessions[userId] && userSessions[userId].modelNumber === numberParam) {
      return res.json({ message: 'Model is already up to date' });
    }

    // Fetch model metadata from the models collection
    // const modelsQuery = query(collection(db, "models"), where("number", "==", parseInt(numberParam)));
    // const querySnapshot = await getDocs(modelsQuery);

    // if (querySnapshot.empty) {
    //   return res.status(404).json({ error: 'No matching instruction found' });
    // }

    // // Get the first matching document for model metadata
    // const modelDoc = querySnapshot.docs[0];

    // Fetch model instruction and temperature from the model_data collection
    const modelDataQuery = query(collection(db, "models_data"), where("number", "==", parseInt(numberParam)));
    const modelDataSnapshot = await getDocs(modelDataQuery);

    if (modelDataSnapshot.empty) {
      return res.status(404).json({ error: 'No matching model data found' });
    }

    // Get the first matching document for model data
    const modelDataDoc = modelDataSnapshot.docs[0];
    const newInstruction = modelDataDoc.data().instruction;
    const temperature = modelDataDoc.data().temperature; // Fetch the model temperature

    // Create a new model instance
    const newModelInstance = genAI.getGenerativeModel({
      model: llmModelName,
      systemInstruction: newInstruction,
      tools: tools
    });

    // Update the user session if it exists
    if (userSessions[userId]) {
      userSessions[userId].instance = newModelInstance; // Update the model instance for the user
      userSessions[userId].modelNumber = numberParam; // Update the model number
      userSessions[userId].temperature = temperature; // Save the model temperature in session
    }

    res.json({
      message: 'Instruction updated successfully',
      newInstruction: newInstruction,
      temperature: temperature // Return the temperature as well
    });
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: 'Error updating instruction' });
  }
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