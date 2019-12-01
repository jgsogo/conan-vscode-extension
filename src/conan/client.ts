import * as vscode from 'vscode';
import * as semver from 'semver';
import {exec, execSync} from 'child_process';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import { create } from 'domain';



export function get_client(workspaceFolder: string): Client {
    console.log("Get new Conan client");
    const config = vscode.workspace.getConfiguration('conan')

    const executable = config.get<string>('executable');
    if (!executable) {
        vscode.window.showErrorMessage('Configure a path to Conan executable');
        throw 'ERROR: Configure a path to Conan executable';  // TODO: Finish command
    }
    
    let userHome = config.get<string>('userHome');
    if (userHome) {
        userHome = userHome.replace('${workspaceFolder}', workspaceFolder);
    }

    let storagePath = config.get<string>('storagePath');
    if (storagePath) {
        storagePath = storagePath.replace('${workspaceFolder}', workspaceFolder);
    }

    return new Client(executable, userHome, storagePath);
}


function execShellCommand(cmd: string) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(stderr.trim());
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
}


class Client {
    executable: string;
    user_home?: string;  // TODO: Make it readonly
    storage_path?: string;  // TODO: Make it readonly
    version: Promise<semver.SemVer>;  // TODO: Make it readonly

    //static re_version: RegExp = new RegExp(/^Conan version ([^\s]+)$/).compile();

    constructor(executable: string, user_home?: string, storage_path?: string) {
        console.log('Client::constructor');
        this.executable = executable;
        this.user_home = user_home;
        this.storage_path = storage_path;
        this.version = this._get_version();
    }

    async _run(command: string, callback: (err: any, data: any) => void) {
        console.log("Command: 'conan %s'", command);
        // TODO: FIXME: Handling environment...
        const old_user_home = process.env.CONAN_USER_HOME;
        const old_storage_path = process.env.CONAN_STORAGE_PATH;

        if (this.user_home) process.env.CONAN_USER_HOME = this.user_home;
        if (this.storage_path) process.env.CONAN_STORAGE_PATH = this.storage_path;
        
        await execShellCommand(`${this.executable} ${command}`)
            .then((data) => { callback(null, data); })
            .catch((data) => {callback(data, null); });

        process.env.CONAN_USER_HOME = old_user_home;
        process.env.CONAN_STORAGE_PATH = old_storage_path;
    }

    async _run_json(command: string, callback: (err: any, data: any) => void) {
        await tmp.file(async (err, path, fd, cleanupCallback) => {
            if (err) {
                callback(err, null);
                return;
            }

            command += ` --json="${path}"`;
            await this._run(command, async (_) => {
                fs.readFile(path, "utf8", (err, data) => {
                    if (err) {
                        callback(err, data);
                    }
                    else {
                        callback(null, JSON.parse(data));
                    }
                });
            });
            cleanupCallback();
        });
    }

    async _get_version(): Promise<semver.SemVer> {
        console.log('Client::_get_version');
        let version = new semver.SemVer("0.0.0");
        await this._run("--version", (err, stdout) => {
            if (err) throw err;
            const matches = stdout.match(/^Conan version ([^\s]+)$/);
            if (matches) {
                version = new semver.SemVer(matches[1], true);
            }
            else {
                throw `Cannot get version from string '${stdout}'`;
            }
        });
        return version;
    }

    /*
    get_profile_folder(): string {
        console.log('Client::get_profile_folder');
        let profile_folder: string = '';
        this._run("config home", (stdout) => {
            profile_folder = path.join(stdout, 'profiles');
        });
        return profile_folder;
    }
    */

    async new_profile(name: string, detect: boolean) {
        console.log('Client::new_profile');
        const command = `profile new${detect ? ' --detect' : ''} ${name}`;
        let profile_path: string = '';
        let profile_created = false;
        await this._run(command, (err, data) => {
            if (err) return;
            const m = data.match(/\: ([^\s]+)$/);
            if (m) {
                profile_created = true;
                profile_path = m[1];
            }
            else {
                console.error(`Cannot parse profile path from string '${data}'`);
            }
        });
        return {created: profile_created, filepath: profile_path};
    }

    get_profiles(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this._run_json("profile list", (err, json) => {
                if (err) {
                    reject(err);
                }
                else {
                    let profiles: string[] = json.map(function(el: string) { return el.toString();});
                    resolve(profiles);
                }
            });
        });
    }

    async install(conanfile: string, install_path: string, profile: string, build: string) {
        console.log('Client::install');
        const command = `install --install-folder=${install_path} --profile=${profile} --build=${build} ${conanfile}`;
        await this._run(command, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(data);
        });
    }

    async create(conanfile: string, profile: string, build: string) {
        console.log('Client::createcreate');
        const command = `create --profile=${profile} --build=${build} ${conanfile}`;
        await this._run(command, (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(data);
        });
    }

    async configure(cmakelists_path: string, build_directory: string) {
        console.log('Client::configure');
        // TODO: play with virtualenvs

        // Run CMake
        const toolchain_file = path.join(build_directory, 'conan_toolchain.cmake')
        const command = `cmake -DCMAKE_TOOLCHAIN_FILE="${toolchain_file}" -S "${cmakelists_path}" -B "${build_directory}"`;
        await execShellCommand(command)
            .then((data) => { console.log(data); })
            .catch((data) => {console.error(data); });
    }

    async build(build_directory: string) {
        console.log('Client::build');
        // TODO: play with virtualenvs

        // Run CMake
        const command = `cmake --build "${build_directory}"`;
        await execShellCommand(command)
            .then((data) => { console.log(data); })
            .catch((data) => {console.error(data); });
    }

}
