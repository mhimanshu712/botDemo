import OpenAI from 'openai';
import { readFile } from 'fs/promises';

const apiKey = "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"; // Replace with your OpenAI API key

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
});

const systemInstruction = "Act like a teaching assistant. You are given a pdf file and a question. You need to answer the question based on the pdf file.";

console.log("fetching pdf");

const pdfResp = await readFile('./books/keph101c.pdf');
const base64Pdf = Buffer.from(pdfResp).toString("base64");

console.log("generating content");
const result = await openai.chat.completions.create({
    model: "mistralai/mistral-small-24b-instruct-2501", // Using GPT-4 Vision as it can handle PDF content
    messages: [
        {
            role: "system",
            content: systemInstruction
        },
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "whats meaning of life?"
                }
            ]
        }
    ],
    max_tokens: 4096
});

console.log(result.choices[0].message.content);