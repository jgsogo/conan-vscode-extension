import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import {get_client} from './conan/client';
import {GlobalState} from './state';


export async function create(state: GlobalState) {
    console.log("Conan >>> create");

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const conanfile = path.join(workspaceFolder, 'conanfile.py');

    let client = get_client(workspaceFolder);
    await client.create(conanfile, state.get_active_profile(), "missing");
    vscode.window.showInformationMessage(`Package created: '${state.get_active_profile()}'`);
}
