const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('./firebaseConfig');
const db = getFirestore(initializeApp(firebaseConfig));

var userSessionsPersonalData = [];

// Function to collect user info
async function collectUserInfo(name, email) {
    console.log(`Collected user info - Name: ${name}, Email: ${email}`);

    try {
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

// Function to store user information
async function storeInMemory(relevantText) {
    console.log(`Storing user information : ${relevantText}`);
    userSessionsPersonalData.push(relevantText); // Storing in userSessions for demonstration

    return {
        memory: relevantText,
        status: "success"
    };
}

// Function to retrieve user information by key
function getFromMemory(searchText) {
    console.log(`Retrieved all user information - Data:`, userSessionsPersonalData);

    return {
        data: userSessionsPersonalData,
        status: "success"
    };
}

// Function to get the current date and time
function getDateTime() {
    const now = new Date();
    return now.toISOString(); // Returns the date and time in ISO format
}

// Function to add two numbers
function addTwoNumbers(number1, number2) {
    return {
        data: number1 + number2,
        status: "success"
    };
}

const modelFunctions = {
    recordUserInfo: ({ name, email }) => {
        return collectUserInfo(name, email);
    },
    storeInMemory: async ({ relevantText }) => {
        return storeInMemory(relevantText);
    },
    // New function to retrieve stored user information
    getFromMemory: async ({ searchText }) => {
        return getFromMemory(searchText); // Adjust this to your actual retrieval logic
    },
    getDateTime: async () => {
        return getDateTime(); // Call the getDateTime function
    },
    addTwoNumbers: async ({ number1, number2 }) => {
        return addTwoNumbers(number1, number2); // Call the addTwoNumbers function
    }
};

// Export the functions
module.exports = {
    collectUserInfo,
    storeInMemory: storeInMemory,
    getFromMemory: getFromMemory,
    getDateTime: getDateTime,
    addTwoNumbers: addTwoNumbers, // Export the addTwoNumbers function
    modelFunctions,
    userSessionsPersonalData // Export userSessions if needed
}; 