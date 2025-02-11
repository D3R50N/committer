#!/usr/bin/env node

const { types, scopes } = require('./values');

const inquirer = require('inquirer').default;
const { execSync } = require('child_process');


async function commit({ message, shouldPush, files }) {

    console.clear();
    console.log("Welcome to Committer.");

    let commit_message;
    const questions = []

    if (!files) {
        questions.push({
            name: "files",
            message: "Commit files",
            type: "input",
            default: "."
        },)
    }
    if (!message) {
        console.log("It's recommended to use only one type and only one scope per commit. 🚀😉");
        questions.push(
            {
                name: "types",
                message: "Commit types",
                type: "checkbox",
                choices: types.map(c => c.title),
                default: ["Update"],
                loop: false,
            },
            {
                name: "scopes",
                message: "Commit scopes",
                type: "checkbox",
                choices: scopes.map(c => c.title),
                loop: false,
            },
        )
    }

    const result = await inquirer.prompt(questions);

    if (files) {
        result.files = files;
    }

    if (message) {
        commit_message = message;
    } else {



        const commit_types = types.filter(t => result.types.includes(t.title)).map(t => t.value);
        const commit_scopes = scopes.filter(t => result.scopes.includes(t.title)).map(s => s.value);

        if (commit_scopes.length == 0) {
            const custom_scope = await inquirer.prompt([{
                name: "scope",
                message: "No scope choosen. Write you own scope ?",
                type: "input",
            }])
            if (custom_scope.scope.trim() != "")
                commit_scopes.push(custom_scope.scope);
        }

        const description = await inquirer.prompt([{
            name: "description",
            message: "Commit description",
            type: "input",
        }])


        function capitalize(str = "") {
            if (str.trim() == "") return "";
            return str[0].toUpperCase() + str.slice(1);
        }
        const out = {
            type: commit_types.join(" & "),
            scope: commit_scopes.length > 0 ? `(${commit_scopes.join("+")})` : "",
            desc: description.description ? `: ${capitalize(description.description)}` : "",
        }

        commit_message = `${out.type}${out.scope}${out.desc}`;

    }

    const command = {
        add: `git add ${result.files}`,
        commit: `git commit -m "${commit_message}"`
    }

    for (let key in command) {
        execCommand(command[key])
    }



    let action = shouldPush ? { push: true } : await inquirer.prompt([{
        name: "push",
        message: "Push to default branch ?",
        type: "confirm",
        default: false,
    }]);

    if (action.push) {
        execCommand(`git push`);
    }


}

function execCommand(command) {
    console.log(`🌀 Running command \`${command}\``);
    const ret = execSync(command)
    if (ret.toString("utf-8").trim() != "")
        console.log("→", ret.toString("utf-8"));
}


const help = `
Committer Help (committer -h):

Quick Syntax :
    committer "commit message" [-p] [-f <files>]
    
Prompt-based Syntax :
    committer

Args :
    -p or --push, Wheither if should push after commit
    -f or --files, Specify files to commit (spaced separated)
`;

async function main() {
    try {
        const args = process.argv.slice(2);
        const options = {};
        const keywords = ['-p', "--push", '-f', "--files"]
        if (args.length > 0) {
            if (args[0] == "-h") {
                console.log(help);
                return;
            }
            if (keywords.includes(args[0]) || args[0].trim() == "") {
                console.error("Commit message required. Check help (-h)");
                return;
            }

            options.message = args[0].trim();
            options.shouldPush = args.includes("-p") || args.includes("--push");


            function retrieveFiles(key) {
                if (args.includes(key)) {
                    const index = args.indexOf(key);
                    return args.slice(index + 1);
                }
                return null;
            }

            let files = '.';

            for (let key of ["-f", "--files"]) {
                let retrieved = retrieveFiles(key);
                if (retrieved) {
                    files = retrieved.filter(f => !keywords.includes(f)).join(" ");
                    break;
                }
            }

            if (files.trim() == "") {
                console.error("Commit files required. Check help (-h)");
                return;
            }

            options.files = files;

        }
        await commit(options);
    } catch (err) {
        console.log(`Cannot commit because 👉 ${err.message}`);
        process.exit(1);
    }
}



main()