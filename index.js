import fs from 'fs';
import cheerio from 'cheerio';
import { OpenAI } from 'openai';
import promptSync from 'prompt-sync';
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const prompt = promptSync();
const app = express();
const port = process.env.PORT || 3002;
const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey });

async function createAssistant() {
    let assistant;
    try {
        assistant = await client.beta.assistants.create({
            model: 'gpt-4-1106-preview',
            name: 'sitereader',
            instructions: 'You are an information provider. When given all the HTML content of a site, you must answer any questions about the text content of the site.',
            tools: [{ type: 'retrieval' }],
        });
    } catch (error) {
        console.error('Error creating assistant:', error);
        throw error;
    }
    return assistant;
}

async function processUserInput() {
    let assistant = await createAssistant();
    while (true) {
        const userInput = prompt("Input 'quit' to stop or 'start' to begin a new query: ");
        if (userInput.toLowerCase() === 'quit') {
            break;
        } else if (userInput.toLowerCase() === 'start') {
            const url = prompt('Enter URL: ');
            await axios.get(`http://localhost:${port}/api/file`, { params: { url } });
        } else {
            console.log("Invalid input. Please enter 'quit' or 'start'.");
        }
    }
}

app.get('/api/file', async (req, res) => {
    const url = req.query.url;
    console.log(`Fetching URL: ${url}`);
    const response = await axios.get(url);
    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    const textContent = $('body').text();

    const filePath = 'new.txt';
    fs.writeFileSync(filePath, textContent);

    let file = await client.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants'
    });

    res.redirect(`/api/query?fileId=${file.id}`);
});

app.get('/api/query', async (req, res) => {
    const query = prompt("Enter query:");
    const fileId = req.query.fileId;

    try {
        const message = await client.beta.threads.messages.create(threadId, {
            role: "user",
            content: query,
            file_ids: [fileId]
        });
        console.log("Message created:", message);
    } catch (error) {
        console.error('Error creating message:', error);
    }
    res.redirect('/api/running');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

processUserInput();
