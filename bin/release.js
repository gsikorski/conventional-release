#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    path = require('path'),
    readline = require('readline'),
    shell = require('child_process').execSync,
    denodeify = require('denodeify'),
    conventionalChangelog = require('conventional-changelog'),
    mversion = require('mversion'),
    conventionalRecommendedBump = require('conventional-recommended-bump');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let branch = shell('git rev-parse --abbrev-ref HEAD').toString().trim();
if (branch !== 'master') {
    throw Error('You must be on master branch to make a release!');
}
let status = shell('git describe').toString().trim()
    .match(/^(v\d+\.\d+\.\d+)(-(\d)-.*)?$/);
if (!status) {
    throw Error(`Last tag is invalid!`);
}

let lastTag = status[1];
console.log(`Last released tag is: ${lastTag}`);

if (!status[2]) {
    throw Error(`Nothing to release! Please, commit something and try again`);
}

return new Promise((resolve, reject) => {
    console.log(`There are ${status[3]} commits found since last release`);
    rl.question(`Would you like to proceed? [Y/n] `, (answer) => {
        answer.toLowerCase();
        if (answer.length && answer !== 'yes' && answer !== 'y') {
            console.log('Bye!');
            process.exit(0);
        }
        resolve();
    });
}).then(() => {
    console.log('Calculating version number...');
    return denodeify(conventionalRecommendedBump)({
            preset: 'angular'
        });
}).then((whatBump) => {
    console.log('Releasing new version...');
    return denodeify(mversion.update)({
        version: whatBump.releaseAs
    });
}).then((mver) => {
    console.log('Generating changelog...');

    return new Promise((resolve, reject) => {
        let stream = fs.createWriteStream('CHANGELOG.md.new');
        conventionalChangelog({
                preset: 'angular'
            }).pipe(stream);
        stream.on('error', (err) => {
            reject(err);
        });
        stream.on('close', () => {
            // Append old CHANGELOG.md
            let old = '';
            try {
                old += fs.readFileSync('CHANGELOG.md');
            } catch (err) {
                if (!err || err.code !== 'ENOENT') {
                    throw err;
                }
            }
            fs.appendFileSync('CHANGELOG.md.new', old);
            fs.renameSync('CHANGELOG.md.new', 'CHANGELOG.md');
            resolve(mver);
        });
    });
}).then((mver) => {
    shell(`git add CHANGELOG.md ${mver.updatedFiles.join(' ')}`);
    let commitMessage   = `RELEASE: ${mver.newVersion}\n\n`;
    commitMessage      += `Updated files:\n`;
    commitMessage      += `  CHANGELOG.md\n`;
    mver.updatedFiles.forEach((file) => {
        commitMessage  += `  ${path.relative(process.cwd(), file)}\n`;
    })
    shell(`git commit -m'${commitMessage}'`);
    shell(`git tag -am'RELEASE: ${mver.newVersion}' v${mver.newVersion}`);
    return new Promise((resolve) => {
        rl.question(`Release ${mver.newVersion} is ready. ` +
                    `Would you like to push changes to 'origin' ` +
                    `and publish new version to Sinopia? [y/N] `,
                    (answer) => {
            answer = answer.toLowerCase().trim();
            if (answer === 'y' || answer === 'yes') {
                shell('git push');
                shell('git push --tags');
                shell('npm publish');
            }
            resolve();
        });
    });
}).then(process.exit, (err) => {
    if (err instanceof Error) {
        console.error(err.stack);
    } else if (err) {
        console.error(err);
    }
    process.exit(1);
});
