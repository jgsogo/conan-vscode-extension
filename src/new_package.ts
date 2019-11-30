import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";

const conanfile_header_only = require("./templates/conanfile_header_only.py");
const conanfile_library = require("./templates/conanfile_library.py");
//const template = require('lodash.template');
import * as _ from 'lodash';


export async function new_package() {
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
    if (await promisify(fs.exists)(conanfile_filepath)) {
        vscode.window.showErrorMessage('This workspace already contains a conanfile.py!');
        //return -1;
    }

    // Get the name of the package
    let package_name = await vscode.window.showInputBox({
        prompt: 'Enter a name for the new package',
        validateInput: (value: string): string => {
            if (!value.length)
                return 'A package name is required';
            return '';
        },
    });
    if (!package_name) return -1;
    console.log('User input package name "%s"', package_name);
    package_name = package_name.toLowerCase();

    // Select type for the package
    const package_type = await vscode.window.showQuickPick(
        [
            {label: 'Library', description: 'Create a library'},
            {label: 'Header only', description: 'Create a header-only library'}
        ],
        { placeHolder: 'Select the type of library to create.' });
    if (!package_type) return -1;
    console.log('User input package type "%s"', package_type.label);

    // Now we have all the information to create the required files
    //  - conanfile.py
    const tpl_file = package_type.label == "Library" ? conanfile_library.default : conanfile_header_only.default;
    const conanfile_py = await promisify(fs.readFile)(tpl_file, "utf8");    
    await promisify(fs.writeFile)(conanfile_filepath, _.template(conanfile_py)({"name": package_name}));

    // - CMakeLists.txt (if not exists)
    const cmakelists_filepath = path.join(root_dir, 'CMakeLists.txt');

    // - sources and includes (only if CMakeLists)
    
}