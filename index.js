const git = require ('./git.js');

async function bot() {
   await git.initialize();
   await git.login();
   await git.search();
}

bot();