#!/usr/bin/env node

const { types, scopes } = require('./values');

const inquirer = require('inquirer').default;
const args = process.argv.slice(2);

async function commit() {
    console.clear();
    console.log("Welcome to Committer. It's recommended to use only one type and only one scope per commit. 🚀😉");

    const result = await inquirer.prompt([
        {
            name: "files",
            message: "Commit files",
            type: "input",
            default: "."
        },
        {
            name: "types",
            message: "Commit types",
            type: "checkbox",
            choices: types.map(c => c.title),
            default:["Update"],
            loop: false,
        },
        {
            name: "scopes",
            message: "Commit scopes",
            type: "checkbox",
            choices: scopes.map(c => c.title),
            loop: false,
        }
    ])


    const commit_types = types.filter(t => result.types.includes(t.title)).map(t => t.value);
    const commit_scopes = scopes.filter(t => result.scopes.includes(t.title)).map(s => s.value);

    if (commit_scopes.length == 0) {
        const custom_scope = await inquirer.prompt([{
            name: "scope",
            message: "No scope choosen. Write you own scope ?",
            type: "input",
        }])
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
        desc: description.description ? `: ${description.description.split(" ").map(s => capitalize(s)).join(" ")}` : "",
    }



    const message = `${out.type}${out.scope}${out.desc}`;

    const { execSync } = require('child_process');
    const command = {
        add: `git add ${result.files}`,
        commit: `git commit -m "${message}"`
    }

    for (let key in command) {
        console.log(`Running command \`${command[key]}\``);
        execSync(command[key])
   }

}


async function main() {
    try {
        await commit();
    } catch (err) {
        console.log("Cannot commit.");
        process.exit(1);
    } 
}



main()