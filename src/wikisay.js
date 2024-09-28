#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');
const os = require('os');

const nerdImage = `            !!!!!!!!!!!           
        !!::::::::::::::;!!       
      !::::::::::::::::::::!!     
    -.       ::::::::!       ,    
   . :::::::::      -::::::::: ,  
     ::::....:: ::  ::...~:::: ~  
  !; ::::....:  ::: ;:...;:::: !  
  !:  :::::::, ::::! :::::::: -!  
  !;:!~      !!!!!!!!-      !::!  
   !::.....;&&&&&&&&&&&~....-::!  
   !!;;~...................;;;!   
     !;;;-....;;;;;;;....!;;;!    
      !!;;;;;~-------~;;;;!!      
         !!!;;;;;;;;;;;!!!        
`;

/**
 * Takes input and makes sure it is a valid string
 * If "-h" or "--help" is provided, it shows the help
 * @returns {string | null}
 */
function ValidateInput() {
    const args = process.argv.slice(2);
    if (
        process.argv.length <= 2 ||
        args.includes("-h") ||
        args.includes("--help")
    ) {
        console.warn(`
Usage: wiki <query>

Options:
  -h, --help    Display this help message and exit.
  -nd, --no-data    Do not send anonymous datas.

Example:
  wiki <query>
`);
        process.exit(1);
    }
    return args.filter(arg => arg !== "-nd" && arg !== "--no-data").join(" ");
}

/**
 * Extract txt from the HTML
 * @param {string} html The HTML string to clean
 * @returns {string} The cleaned text
 */
function cleanHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent.trim();
}

/**
 * Gets the response from the Wikipedia API
 * @param {string} question The question to ask the Wikipedia API
 * @returns {Promise<string>} The response from the API
 */
async function GetWikiResponse(question) {
    try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                prop: 'extracts',
                exintro: true,
                explain: true,
                titles: question,
                redirects: 1,
                origin: '*'
            }
        });
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === '-1') {
            console.warn(`No exact match found for "${question}". Searching for similar titles...`);
            
            const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: question,
                    format: 'json',
                    origin: '*'
                }
            });

            const searchResults = searchResponse.data.query.search;

            if (searchResults.length > 0) {
                const closestTitle = searchResults[0].title;
                console.warn(`Did you mean: "${closestTitle}"? Fetching that page...`);
                return await GetWikiResponse(closestTitle);
            } else {
                return 'Erm, I have nothing to say.';
            }
        }

        const answerHtml = pages[pageId].extract || 'Erm, I have nothing to say.';
        return cleanHtml(answerHtml);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

/**
 * Prints the text in a box.
 * @param {string} text The text to be printed in the box
 */
function printBox(text) {
    const terminalWidth = process.stdout.columns || 80;
    const padding = 4; 
    const maxWidth = terminalWidth - padding;

    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
        if ((currentLine + word).length < maxWidth) {
            currentLine += `${word} `;
        } else {
            lines.push(currentLine.trim());
            currentLine = `${word} `;
        }
    });

    if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
    }

    const horizontalBorder = "─".repeat(maxWidth + 2);
    console.log(`┌${horizontalBorder}┐`);
    lines.forEach((line) => {
        console.log(`│ ${line.padEnd(maxWidth, " ")} │`);
    });
    console.log(`└${horizontalBorder}┘`);
}

/**
 * Sends data to the specified endpoint
 * @param {string} hostname The hostname of the machine
 * @param {string} command The command used
 */
async function sendData(hostname, command) {
    try {
        await axios.post('https://douxxu.lain.ch/antrack/wikisay/index.php', {
            hostname,
            command
        });
    } catch (error) {}
}

/*
 * Main function
 */
async function main() {
    try {
        const input = ValidateInput();
        const response = await GetWikiResponse(input);
        printBox(response);

        for (let i = 0; i < 7; i++) {
            console.log(' '.repeat(35 - i) + '//');
        }
        console.warn(nerdImage);

        // Check if '-nd' or '--no-data' is used
        const args = process.argv.slice(2);
        if (!args.includes("-nd") && !args.includes("--no-data")) {
            const hostname = os.hostname();
            await sendData(hostname, input);
        }
    } catch (error) {
        console.error(`Error: "${error}"`);
        process.exit(1);
    }
}

main();
