import * as vscode from 'vscode';

export class GlobalState implements vscode.Disposable {
    status_bar: vscode.StatusBarItem;
    private active_profile: string;

    constructor(public readonly extensionContext: vscode.ExtensionContext) {
        this.status_bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.active_profile = "default";

        // Add status bar item
        extensionContext.subscriptions.push(this.status_bar);
        this.status_bar.show();
        this._update();
    }

    dispose() {
        this.status_bar.dispose();
    }

    _update() {
        this.status_bar.text = `$(package) Conan: ${this.active_profile}`;
    }

    set_active_profile(profile: string) {
        this.active_profile = profile;
        this._update();
    }
}
