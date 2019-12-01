import * as vscode from 'vscode';
import {get_client} from './conan/client'
import {GlobalState} from './state';

export async function select_profile(state: GlobalState) {
    console.log("Conan >>> select_profile");

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Get profile list
    let client = get_client(workspaceFolder);
    client.get_profiles().then((profiles: string[]) => {
        if (profiles.length === 0) {
            vscode.window.showErrorMessage('No profiles found. Create one using command "Create new profile"');
            return;
        }
        // Let the user choose one
        const profile_selected = vscode.window.showQuickPick(profiles, {placeHolder: 'Select a profile'});
        profile_selected.then((value) => {
            if (value) {
                // Activate profile in context
                console.log('Profile selected: "%s"', value);
                state.set_active_profile(value);
            }
        });
    });
}