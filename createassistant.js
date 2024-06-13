import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey: apiKey });

let assistant; // Declare the assistant variable outside the function

const getAssistant = async () => {
  if (!assistant) {
    try {
      assistant = await client.beta.assistants.create({
        model: 'gpt-4-1106-preview',
        name: 'sitereader',
        instructions: 'You are an information provider. When given all the HTML content of a site, you must answer any questions about the text content of the site.',
        tools: [{ type: 'retrieval' }],
      });

      console.log(assistant);
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    }
  }
  return assistant;
};
assistant = getAssistant()
print(assistant)
