// Dictionary simplifier script for Bun
import { readFileSync, writeFileSync } from 'fs';

const inputFile = 'french_dict.json';
const outputFile = 'simplified_dictionary.json';

const simplifiedDictionary = {};

// Read and process the file
const file = readFileSync(inputFile, 'utf-8');
const lines = file.split('\n').filter(line => line.trim());

console.log('Processing dictionary...');

for (const line of lines) {
    try {
        const entry = JSON.parse(line);
        
        // Skip entries that are just form-of another word
        if (entry.tags && entry.tags.includes('form-of')) {
            continue;
        }

        // Get the base form if available
        const baseForm = entry.forms && entry.forms.length > 0 
            ? entry.forms[0].form 
            : entry.word;

        // Extract definitions from senses
        const definitions = [];
        if (entry.senses) {
            for (const sense of entry.senses) {
                if (sense.glosses) {
                    // Filter out definitions that are just "Plural of X" or similar
                    const validGlosses = sense.glosses.filter(gloss => 
                        !gloss.toLowerCase().startsWith('pluriel de') &&
                        !gloss.toLowerCase().startsWith('féminin de')
                    );
                    definitions.push(...validGlosses);
                }
            }
        }

        // Only add entries that have actual definitions
        if (definitions.length > 0) {
            const simplifiedEntry = {
                word: baseForm,
                pos: entry.pos,
                definitions: definitions
            };

            // Use the base form as the key
            const key = baseForm.toLowerCase();
            if (!simplifiedDictionary[key]) {
                simplifiedDictionary[key] = simplifiedEntry;
            } else {
                // If entry already exists, append new definitions
                simplifiedDictionary[key].definitions = [
                    ...new Set([
                        ...simplifiedDictionary[key].definitions,
                        ...definitions
                    ])
                ];
            }
        }
    } catch (error) {
        console.error('Error processing line:', error);
    }
}

// Write the simplified dictionary
try {
    writeFileSync(
        outputFile,
        JSON.stringify(simplifiedDictionary, null, 2)
    );
    
    console.log('Dictionary processing complete!');
    console.log('Total entries:', Object.keys(simplifiedDictionary).length);
    
    // Log a sample entry
    const sampleKey = Object.keys(simplifiedDictionary)[0];
    console.log('Sample entry:', simplifiedDictionary[sampleKey]);
} catch (error) {
    console.error('Error writing output file:', error);
}