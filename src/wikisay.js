#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');


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
Takes input and makes sure it is a valid string
If "-h" or "--help" is provided, it shows the help
@returns {string | null}
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

Example:
  wiki
`);
        process.exit(1);
    }
    return args.join(" ");
}

/**
extract txt from the HTML
@param {string} html The HTML string to clean
@returns {string} The cleaned text
*/
function cleanHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent.trim();
}

/**
Gets the response from the Wikipedia API
@param {string} question The question to ask the Wikipedia Api
@returns {Promise<string>} The response from the Aip
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
                origin: '*'
            }
        });
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const answerHtml = pages[pageId].extract || 'Erm i have nothing to say.';
        return cleanHtml(answerHtml);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

/**
Prints the text in a box.
@param {string} text The text to be printed in the box
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

/*
Main function
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
    } catch (error) {
        console.error(`Error: "${error}"`);
        process.exit(1);
    }
}

main();
