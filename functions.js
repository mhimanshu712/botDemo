const { getFirestore, collection, addDoc, getDocs, query, orderBy, where } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('./firebaseConfig');
const db = getFirestore(initializeApp(firebaseConfig));

var userSessionsPersonalData = {};

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
async function storeUserInformation(key, value) {
    console.log(`Storing user information - Key: ${key}, Value: ${value}`);
    userSessionsPersonalData[key] = value; // Storing in userSessions for demonstration

    return {
        key: key,
        value: value,
        status: "success"
    };
}

// Function to retrieve user information by key
function retrieveUserInformation(userMessage) {
    console.log(`Retrieved all user information - Data:`, userSessionsPersonalData);
    return {
        data: userSessionsPersonalData,
        status: "success"
    };
}

// Export the functions
module.exports = {
    collectUserInfo,
    storeUserInformation,
    retrieveUserInformation,
    userSessionsPersonalData // Export userSessions if needed
}; 