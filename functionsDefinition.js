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

// Declaration for storeUserInformation
const storeInMemoryFunctionDeclaration = {
    name: "storeInMemory",
    parameters: {
        type: "OBJECT",
        description: "Store a text that needs to be remembered.",
        properties: {
            relevantText: {
                type: "STRING",
                description: "The information to be remembered",
            }
        },
        required: ["relevantText"],
    },
};

// Declaration for retrieveUserInformation
const getFromMemoryFunctionDeclaration = {
    name: "getFromMemory",
    parameters: {
        type: "OBJECT",
        description: "Retrieve all stored information from the memory.",
        properties: {
            searchText: {
                type: "STRING",
                description: "The information to be retrieved from the memory",
            }
        },
        required: ["searchText"], // Make key a required parameter
    },
};

// Declaration for getDateTime
const getDateTimeFunctionDeclaration = {
    name: "getDateTime",
    parameters: {
        type: "string",
        description: "Retrieve the current date and time.",
        properties: {},
        required: [],
    },
};

// Declaration for addTwoNumbers
const addTwoNumbersFunctionDeclaration = {
    name: "addTwoNumbers",
    parameters: {
        type: "OBJECT",
        description: "Add two numbers together.",
        properties: {
            number1: {
                type: "NUMBER",
                description: "The first number to add",
            },
            number2: {
                type: "NUMBER",
                description: "The second number to add",
            }
        },
        required: ["number1", "number2"],
    },
};

// Export the function declarations
module.exports = {
    recordUserInfoFunctionDeclaration,
    storeInMemoryFunctionDeclaration,
    getFromMemoryFunctionDeclaration,
    getDateTimeFunctionDeclaration,
    addTwoNumbersFunctionDeclaration,
}; 