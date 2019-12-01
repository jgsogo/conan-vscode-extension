import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import { Uri, window, Disposable } from 'vscode';
import { QuickPickItem } from 'vscode';
import { workspace } from 'vscode';
import * as request from 'request';
import { stringify } from 'querystring';


// Example https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/quickOpen.ts

const endpoint = 'https://center.conan.io/api/ui/search?name_fragment='

function search(query: string, callback: (err: any, data: PackageItem[]) => void) {
    if (query.length <= 3) {
        callback(null, []);
        return;
    }

    const url = `${endpoint}${query}`;
    console.log("Search in conan-center: '%s'", url);

    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            console.log('return body: %s', body);
            var info = JSON.parse(body);
            let packages = info.packages.forEach((element: {name: string, user: string, channel: string, description: string, latest_version: string;}) => {
                return new PackageItem(element.name, element.description);
            });
            console.log('+++ callback');
            callback(null, packages);
        }
        else {
            console.log('return error: %s', error);
            callback(error, []);
        }
    })
}


class PackageItem implements QuickPickItem {

    label: string;
    description: string;
    base: string;
    uri: string;
    
    constructor(name: string, description: string) {
        this.uri = name;
        this.base = name;
        this.label = name;
        this.description = description;
    }
}


class MessageItem implements QuickPickItem {

    label: string;
    description = '';
    detail: string;
    base: string;
    message: string;
    
    constructor(base: string, message: string) {
        this.label = message.replace(/\r?\n/g, ' ');
        this.detail = base;
        this.base = base;
        this.message = message;
    }
}


export async function search_conan_center() {
    console.log('Conan >>> search_conan_center');

    const disposables: Disposable[] = [];
    try {
        return await new Promise<string | undefined>((resolve, reject) => {
            const input = window.createQuickPick<PackageItem | MessageItem>();
            input.placeholder = 'Type to search for packages';
            //let rg: cp.ChildProcess;
            disposables.push(
                input.onDidChangeValue(value => {
                    //if (rg) rg.kill();
                    if (!value) {
                        input.items = [];
                        return;
                    }
                    input.busy = true;
                    search(value, (error, packages) => {
                        console.log('Back from search');
                        if (!error) {
                            console.log('Add more packages, %s more', packages.length);
                            input.items = input.items.concat(packages);
                        }
                        else {
                            console.log('Error, cadd a message');
                            input.items = input.items.concat([new MessageItem("faailure", error)]);
                        }
                        input.busy = false;
                    });
                }),
                input.onDidChangeSelection(items => {
                    const item = items[0];
                    if (item instanceof PackageItem) {
                        resolve(item.label);
                        input.hide();
                    }
                }),
                input.onDidHide(() => {
                    //if(rg) rg.kill();
                    resolve(undefined);
                    input.dispose();
                })
            );
            input.show();
        });
    }
    finally {
        disposables.forEach(d => d.dispose());
    }
}
