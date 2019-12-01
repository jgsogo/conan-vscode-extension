import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from "util";
import * as _ from 'lodash';

// Require the template files, so they are packaged into the extension
const conanfile = require("../templates/conanfile.py");
const cmakelists = require('../templates/CMakeLists.txt');
const header = require('../templates/header.h');
const source = require('../templates/source.cpp');
const tp_cmakelists = require('../templates/test_package/CMakeLists.txt');
const tp_conanfile = require('../templates/test_package/conanfile.py');
const tp_test_package = require('../templates/test_package/test_package.cpp');


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
        return -1;
    }

    // Get the name of the package
    let package_name_input = await vscode.window.showInputBox({
        prompt: 'Enter a name for the new package',
        validateInput: (value: string): string => {
            if (!value.length)
                return 'A package name is required';
            return '';
        },
    });
    if (!package_name_input) return -1;
    console.log('User input package name "%s"', package_name_input);
    const package_name = package_name_input.toLowerCase();

    // Select type for the package
    const package_type = await vscode.window.showQuickPick(
        [
            {label: 'Library', description: 'Create a library'},
            {label: 'Header only', description: 'Create a header-only library'}
        ],
        { placeHolder: 'Select the type of library to create.' });
    if (!package_type) return -1;
    console.log('User input package type "%s"', package_type.label);
    const is_library = Boolean(package_type.label === "Library");

    /* TODO: Ask the user if they want to create a Git repository, it will
        do several things: create the actual Git repo, add SCM to the repo,
        create the '.gitignore' for the files/folders that this extension
        will introduce,...
    */


    let context = {'name': package_name, 'is_library': is_library};

    // Now we have all the information to create the required files
    let files_created: string[] = [];
    let fn_create = async (template: string, context: any, output_path: string) => {
        const full_path = path.join(root_dir, output_path);
        console.log("About to create '%s'", full_path);
        await fs.promises.mkdir(path.dirname(full_path), {recursive: true}).catch(console.error);
        if (!await promisify(fs.exists)(full_path)) {
            const tpl_content = await promisify(fs.readFile)(template, "utf8");
            _.templateSettings.interpolate = /<%=([\s\S]+?)%>/g; // Disable interpolation of '${}'
            await promisify(fs.writeFile)(full_path, _.template(tpl_content)(context));
            files_created.push(output_path);
            return true;
        }
        return false;
    };

    //  - conanfile.py
    await fn_create(conanfile.default, context, 'conanfile.py');

    // - CMakeLists.txt (if not exists)
    const cmakelists_created = await fn_create(cmakelists.default, context, 'CMakeLists.txt');
    if (cmakelists_created) {
        // - source and header, only if CMakeLists was created
        await fn_create(header.default, context, path.join('include', package_name, package_name + '.h'));
        if (is_library) {
            await fn_create(source.default, context, path.join('src', package_name + '.cpp'));
        }
    }

    // - test_package_files
    if (!await promisify(fs.exists)(path.join(root_dir, 'test_package'))) {
        await fn_create(tp_cmakelists.default, context, path.join('test_package', 'CMakeLists.txt'));
        await fn_create(tp_conanfile.default, context, path.join('test_package', 'conanfile.py'));
        await fn_create(tp_test_package.default, context, path.join('test_package', 'test_package.cpp'));
    };

    vscode.window.showInformationMessage(`Package ready, files created: '${files_created.join("', '")}'`);
}