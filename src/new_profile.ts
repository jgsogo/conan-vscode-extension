import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as _ from 'lodash';
import {get_client} from './conan/client';
import { file } from 'tmp';

export async function new_profile() {
    console.log("Conan >>> new profile");

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let client = get_client(workspaceFolder);

    // Ask for a name
    let profile_name_input = await vscode.window.showInputBox({
        prompt: 'Enter a name for the new profile',
        validateInput: (value: string): string => {
            if (!value.length) {
                return 'A profile name is required';
            }
            return '';
        },
    });
    if (!profile_name_input) {
        return -1;
    }
    console.log('User input profile name "%s"', profile_name_input);
    const profile_name = profile_name_input.toLowerCase();

    // Create profile and open it in the main window
    const {created, filepath} = await client.new_profile(profile_name, true);
    console.log(created);
    console.log(filepath);
    if (!created) {
        vscode.window.showErrorMessage(`A profile named '${profile_name}' already exists`);
        return -1;
    }

    await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(filepath));
}