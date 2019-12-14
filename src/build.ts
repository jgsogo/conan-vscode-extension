import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import {get_client} from './conan/client';
import {GlobalState} from './state';


export async function build(state: GlobalState) {
    console.log("Conan >>> build");

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const working_dir = path.join(workspaceFolder, `build-${state.get_active_profile()}`);

    let client = get_client(workspaceFolder);
    await client.build(working_dir);
    vscode.window.showInformationMessage(`Project built in: '${working_dir}'`);
}
