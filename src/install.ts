import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import {get_client} from './conan/client';
import {GlobalState} from './state';


export async function install(state: GlobalState) {
    console.log("Conan >>> install");

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const working_dir = path.join(workspaceFolder, `build-${state.get_active_profile()}`);
    const conanfile = path.join(workspaceFolder, 'conanfile.py');

    let client = get_client(workspaceFolder);
    await client.install(conanfile, working_dir, state.get_active_profile(), "missing");
    vscode.window.showInformationMessage(`Configuration installed for profile: '${state.get_active_profile()}'`);

    await client.configure(workspaceFolder, working_dir);
    vscode.window.showInformationMessage(`Prooject configured in: '${working_dir}'`);
}
