const path = require('path');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));
// Enable CORS for all domains
app.use(cors());

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const apiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

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

// Store user sessions
const userSessions = {};


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
          model: "gemini-1.5-flash",
          systemInstruction: newInstruction, // Use the fetched instruction
          tools: {
            functionDeclarations: [recordUserInfoFunctionDeclaration],
          }
        })
      };
    }
    generationConfig.temperature = userSessions[userId].temperature || 1;
    const chatSession = userSessions[userId].instance.startChat({
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
      model: "gemini-1.5-flash",
      systemInstruction: newInstruction,
      tools: {
        functionDeclarations: [recordUserInfoFunctionDeclaration],
      }
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