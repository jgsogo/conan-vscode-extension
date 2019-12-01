import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import { Uri, window, Disposable } from 'vscode';
import { QuickPickItem } from 'vscode';
import { workspace } from 'vscode';


// Example https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/quickOpen.ts

const endpoint = 'https://center.conan.io/api/ui/search?name_fragment=boost'

class PackageItem implements QuickPickItem {

    label: string;
    description: string;
    
    constructor(public base: Uri, public uri: Uri) {
        this.label = path.basename(uri.fsPath);
        this.description = path.dirname(path.relative(base.fsPath, uri.fsPath));
    }
}


class MessageItem implements QuickPickItem {

    label: string;
    description = '';
    detail: string;
    
    constructor(public base: Uri, public message: string) {
        this.label = message.replace(/\r?\n/g, ' ');
        this.detail = base.fsPath;
    }
}


export async function search_conan_center() {
    console.log('Conan >>> search_conan_center');

    const disposables: Disposable[] = [];
    try {
        return await new Promise<Uri | undefined>((resolve, reject) => {
            const input = window.createQuickPick<PackageItem | MessageItem>();
            input.placeholder = 'Type to search for packages';
            let rg: cp.ChildProcess;
            disposables.push(
                input.onDidChangeValue(value => {
                    if (rg) rg.kill();
					if (!value) {
						input.items = [];
						return;
					}

                    rg = cp.exec(`rg --files -g ${q}*${value}*${q}`, (err, stdout) => {

                    });

                }),
                input.onDidChangeSelection(items => {
                    const item = items[0];
                    if (item instanceof PackageItem) {
                        resolve(item.uri);
                        input.hide();
                    }
                }),
                input.onDidHide(() => {
                    rgs.forEach(rg => rg.kill());
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