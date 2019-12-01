// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {new_package} from './new_package'
import {install} from './install'
import {select_profile} from './select_profile'
import {new_profile} from './new_profile'
import {GlobalState} from './state';


let state: GlobalState;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "conan" is now active!');
    state = new GlobalState(context);

    // Register the commands for this extension
    context.subscriptions.push(vscode.commands.registerCommand('conan.newPackage', new_package));
    context.subscriptions.push(vscode.commands.registerCommand('conan.install', install));
    context.subscriptions.push(vscode.commands.registerCommand('conan.selectProfile', () => {select_profile(state);}));
    context.subscriptions.push(vscode.commands.registerCommand('conan.newProfile', new_profile));

    // Add status bar item
    //context.subscriptions.push(state.status_bar);
    //context.workspaceState.

    vscode.commands.executeCommand("setContext", "inConanPackage", true);
}

// this method is called when your extension is deactivated
export function deactivate() {
    console.log('Extension "conan" is deactivated');
}
