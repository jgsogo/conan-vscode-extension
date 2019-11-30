import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function new_package() {
    /* This function will create the basic scaffolding for a package in
        the root of the workspace: conanfile.py, CMake files, src and
        include directories. Other files might be added in the future.
    */
    console.log('Conan >>> new_package');

    // We need to be in a folder
    if (vscode.workspace.workspaceFolders === undefined) {
      vscode.window.showErrorMessage('No folder is open.');
      return -1;
    }

    const root_dir = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Check if the conanfile.py already exists
    const conanfile_filepath = path.join(root_dir, 'conanfile.py');
    if (fs.existsSync(conanfile_filepath)) {
      vscode.window.showErrorMessage('This workspace already contains a conanfile.py!');
      return -1;
    }

    const package_name = vscode.window.showInputBox({
        prompt: 'Enter a name for the new package',
        validateInput: (value: string): string => {
            if (!value.length)
                return 'A package name is required';
            return '';
        },
    });
    if (!package_name) {
        vscode.window.showErrorMessage('No package name provided.');
        return -1;
    }

    const package_type = (vscode.window.showQuickPick([
        {
            label: 'library',
            description: 'Create a library',
        },
        {
            label: 'header_only', 
            description: 'Create a header-only library'
        }
    ]));
    if (!package_type) return -1;

    // Now we have all the information to create the required files
    //  - conanfile.py
    let conanfile_tpl = fs.readFileSync(`conanfile_${package_type.label}.xml`, 'utf8');

    const cmakelists_filepath = path.join(root_dir, 'CMakeLists.txt');
    


}