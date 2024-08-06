#!/usr/bin/env node

const evilDns = require('./evil-dns.js');
const EdgeGrid = require('akamai-edgegrid');
const newman = require('newman/bin/newman');

let newmanArgv = process.argv;

const forcedResolutions = process.argv
                            .filter(a => a.startsWith("--ak-resolve="))
                            .map(arg => arg.substring("--ak-resolve=".length));
for (const resolutionInstruction of forcedResolutions) {
    const [host, ip] = resolutionInstruction.split(/:(.*)/);
    evilDns.add(host, ip);
}

const edgeGridOptions = process.argv.filter(a => a.startsWith("--ak-edgegrid"));
if (edgeGridOptions?.length) {
    const edgeGridCredentials = new EdgeGrid({path: '~/.edgerc'}).config
    for (const key in edgeGridCredentials) {
        if (Object.hasOwnProperty.call(edgeGridCredentials, key)) {
            const value = edgeGridCredentials[key];
            newmanArgv.push("--env-var", `edgegrid_${key}=${value}`);
        }
    }
}

newmanArgv = newmanArgv.filter(a => !a.startsWith("--ak-"));

// Run this script
newman(newmanArgv, null);