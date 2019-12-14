import { window, Disposable } from 'vscode';
import { QuickPickItem } from 'vscode';
import * as request from 'request';


// Dynamic pick adapted from: https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/quickOpen.ts


function search(query: string, callback: (err: any, data: PackageItem[]) => void) {
    const url = `https://center.conan.io/api/ui/search?name_fragment=${query}`;
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            let packages = info.packages.map((element: {name: string, user: string, channel: string, description: string, latest_version: string;}) => 
                new PackageItem(element.name,
                                element.latest_version,
                                element.description,
                                element.user === '_' ? undefined : element.user,
                                element.channel === '_' ? undefined : element.channel)
            );
            callback(null, packages);
        }
        else {
            callback(error, []);
        }
    })
}


class PackageItem implements QuickPickItem {

    label: string;
    description: string;

    constructor(public name: string, public version: string, description: string, public user?: string, public channel?: string) {
        this.label = `${name}/${version}`;
        if (user && channel) {
            this.label += `@${user}/${channel}`;
        }
        this.description = description;
    }

    get_reference() {
        return this.label;
    }
}


export async function search_conan_center() {
    console.log('Conan >>> search_conan_center');
    const pck = await dynamic_search();
    if (pck) {
        console.log('Got package selection: %s', pck.get_reference());
    }
}

async function dynamic_search() {
    const disposables: Disposable[] = [];
    try {
        return await new Promise<PackageItem | undefined>((resolve, reject) => {
            const input = window.createQuickPick<PackageItem>();
            input.placeholder = 'Type to search for packages in Conan Center';
            disposables.push(
                input.onDidChangeValue(value => {
                    if (!value || value.length < 3) {
                        input.items = [];
                        return;
                    }
                    input.busy = true;
                    search(value, (error, packages) => {
                        if (!error) {
                            input.items = input.items.concat(packages);
                            // Remove duplicates
                            let a = input.items.concat();
                            for(var i=0; i<a.length; ++i) {
                                for(var j=i+1; j<a.length; ++j) {
                                    if(a[i].label === a[j].label) a.splice(j--, 1);
                                }
                            }
                            input.items = a;
                        }
                        input.busy = false;
                    });
                }),
                input.onDidChangeSelection(items => {
                    const item = items[0];
                    if (item instanceof PackageItem) {
                        resolve(item);
                        input.hide();
                    }
                }),
                input.onDidHide(() => {
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
