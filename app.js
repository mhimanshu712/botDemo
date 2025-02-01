const path = require('path');
const cors = require('cors');
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');
const {
  userSessionsPersonalData,
  modelFunctions
} = require('./functions');
const firebaseConfig = require('./firebaseConfig');
const OpenAI = require('openai');
const {
  addTwoNumbersFunctionDeclaration,
  toolsMap
} = require('./functionsDefinition');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));
// Enable CORS for all domains
app.use(cors());

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const googleApiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";
const apiKey = "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";
const googleBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
const openRouterBaseUrl = "https://openrouter.ai/api/v1";
const openai = new OpenAI({
  baseURL: googleBaseUrl,
  apiKey: googleApiKey,
});

const defaultModelOpenRouter = "mistralai/mistral-small-24b-instruct-2501";
const defaultModel = "gemini-2.0-flash-exp";
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
  console.log("******new request********");
  try {
    const userId = req.body.userId;
    const modelNumber = req.params.number;

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
      const temperature = doc.data().temperature;
      const allowedFunctions = doc.data().allowedFunctions;
      var allowedFunctionsObjects = [addTwoNumbersFunctionDeclaration];
      if (allowedFunctions && allowedFunctions.length > 0) {
        allowedFunctionsObjects = allowedFunctions.map(functionName => toolsMap[functionName]);
      }

      // Create a new model instance for the user with the fetched instruction
      userSessions[userId] = {
        modelNumber: modelNumber,
        temperature: temperature,
        systemInstruction: newInstruction,
        functions: allowedFunctionsObjects
      };
    }

    const messages = [
      {
        role: "system",
        content: userSessions[userId].systemInstruction
      }
    ];

    // Add conversation history
    if (req.body.history && req.body.history.length > 0) {
      req.body.history.forEach(msg => {
        messages.push({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.parts[0].text
        });
      });
    }

    // Add the new user message
    messages.push({
      role: "user",
      content: req.body.message
    });

    // Convert functions to tools format
    const tools = userSessions[userId].functions ? userSessions[userId].functions.map(func => ({
      type: "function",
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    })) : [];

    console.log("*******messages******");
    console.log(messages);
    const result = await openai.chat.completions.create({
      model: defaultModel,
      messages: messages,
      temperature: userSessions[userId].temperature || 1,
      tools: tools,
      tool_choice: "auto"
    });

    console.log("*******model response******");
    console.log(result);
    
    let response = result.choices[0].message.content;
    
    // Handle tool calls if present
    if (result.choices[0].message.tool_calls) {
      const toolCall = result.choices[0].message.tool_calls[0];
      const apiResponse = modelFunctions[toolCall.function.name](JSON.parse(toolCall.function.arguments));

      // Send the tool response back to the model
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [toolCall]
      });
      
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(apiResponse)
      });

      console.log("****message after tool call*****");
      console.log(messages);
      // Filter out tool-related messages for Google API compatibility
      const filteredMessages = messages.filter(msg => 
        msg.role !== 'tool' && !msg.tool_calls
      ).map(msg => ({
        role: msg.role,
        content: msg.content || '' // Ensure content is never null
      }));

      console.log("****filtered messages*****");
      console.log(filteredMessages);
      const result2 = await openai.chat.completions.create({
        model: defaultModel,
        messages: filteredMessages,
        temperature: userSessions[userId].temperature || 1
      });

      response = result2.choices[0].message.content;
    }

    console.log("*******final response******");
    console.log(response);

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
    const userId = req.query.userId;

    if (userSessions[userId] && userSessions[userId].modelNumber === numberParam) {
      return res.json({ message: 'Model is already up to date' });
    }

    const modelDataQuery = query(collection(db, "models_data"), where("number", "==", parseInt(numberParam)));
    const modelDataSnapshot = await getDocs(modelDataQuery);

    if (modelDataSnapshot.empty) {
      return res.status(404).json({ error: 'No matching model data found' });
    }

    const modelDataDoc = modelDataSnapshot.docs[0];
    const newInstruction = modelDataDoc.data().instruction;
    const temperature = modelDataDoc.data().temperature;
    const allowedFunctions = modelDataDoc.data().allowedFunctions;
    var allowedFunctionsObjects = [addTwoNumbersFunctionDeclaration];
    if (allowedFunctions && allowedFunctions.length > 0) {
      allowedFunctionsObjects = allowedFunctions.map(functionName => toolsMap[functionName]);
    }

    if (userSessions[userId]) {
      userSessions[userId].systemInstruction = newInstruction;
      userSessions[userId].modelNumber = numberParam;
      userSessions[userId].temperature = temperature;
      userSessions[userId].functions = allowedFunctionsObjects;
    }

    res.json({
      message: 'Instruction updated successfully',
      newInstruction: newInstruction,
      temperature: temperature
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