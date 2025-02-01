import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from 'fs/promises';

const apiKey = "AIzaSyBTp0fnGBgBG3cClzOXJP2bB1_awd9s0Qw";;

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192
};

//const llmModelName = "gemini-2.0-flash-exp";
const llmModelName = "gemini-2.0-flash-thinking-exp-1219";

const genAI = new GoogleGenerativeAI(apiKey);

const newInstruction = "Act like a teaching assistant. You are given a pdf file and a question. You need to answer the question based on the pdf file.";

const model = genAI.getGenerativeModel({ model: llmModelName, systemInstruction: newInstruction, });

console.log("fetching pdf");

const pdfResp = await readFile('./books/keph101c.pdf');

console.log("generating content");
const result = await model.generateContent([
    {
        inlineData: {
            data: Buffer.from(pdfResp).toString("base64"),
            mimeType: "application/pdf",
        },
    },
    'solve question 3.17 from the book',
]);
console.log(result.response.text());