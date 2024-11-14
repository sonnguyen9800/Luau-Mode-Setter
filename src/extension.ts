import * as vscode from 'vscode';

var PACKAGE_NAME  =  "Luau Mode Setter";

export function activate(context: vscode.ExtensionContext) {
	// Function to activate/deactivate based on the presence of .luau files
	vscode.window.showInformationMessage(PACKAGE_NAME + " Started!");
    vscode.commands.executeCommand('setContext', 'luauModeSetterActivated', true);


	activateCommands();

	async function checkLuauFiles() {
		const files = await vscode.workspace.findFiles('**/*.luau');
		if (files.length === 0) {
			console.log('No .luau files found. Deactivating extension.');
			deactivate(context);
		} else if (context.subscriptions.length === 0) {
			// Re-activate commands if they were deactivated
			activateCommands();
		}
	}

	// Helper function to set the mode for each selected file
	async function setLuauMode(uris: vscode.Uri[], mode: string) {
		for (const uri of uris) {
			setLuauModeSingle(uri, mode);
		}
	}
    async function isDirectory(uri: vscode.Uri): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.Directory;
        } catch (error) {
            console.error("Error checking if URI is a folder:", error);
            return false;
        }
    }

	async function setLuauModeSingle(uri: vscode.Uri, mode: string) {

		if (await isDirectory(uri)){
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(uri, '**/*.luau')
            );
            setLuauMode(files, mode);
			return;
		}
		const document = await vscode.workspace.openTextDocument(uri);

		const text = document.getText();

		// Check if the file already has a mode directive
		let newText;
		if (text.startsWith('--!')) {
			newText = text.replace(/^--!\w+/, mode);
		} else {
			newText = mode + '\n' + text;
		}

		// Apply the changes
		const edit = new vscode.WorkspaceEdit();
		edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newText);
		await vscode.workspace.applyEdit(edit);
		await document.save();

	}

	// Function to activate commands and register them in context
	function activateCommands() {
		const setModeStrict = vscode.commands.registerCommand('extension.setModeStrict', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {

			if (allSelections.length > 1){
				setLuauMode(allSelections, '--!strict');
			}
			else{
				setLuauModeSingle(contextSelection, '--!strict');

			}
		});

		const setModeNonstrict = vscode.commands.registerCommand('extension.setModeNonstrict', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
			if (allSelections.length > 1){
				setLuauMode(allSelections, '--!nonstrict');
			}
			else{
				setLuauModeSingle(contextSelection, '--!nonstrict');
			}
		});

		const setModeNocheck = vscode.commands.registerCommand('extension.setModeNocheck', (contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
			if (allSelections.length > 1){
				setLuauMode(allSelections, '--!nocheck');
			}
			else{
				setLuauModeSingle(contextSelection, '--!nocheck');
			}
		});

		context.subscriptions.push(setModeStrict, setModeNonstrict, setModeNocheck);

	}

	

	// Initial command activation
	checkLuauFiles();

	// Watch for .luau file additions and deletions
	const watcher = vscode.workspace.createFileSystemWatcher('**/*.luau');
	watcher.onDidCreate(() => checkLuauFiles());
	watcher.onDidDelete(() => checkLuauFiles());

	// Dispose of the watcher when the extension deactivates
	context.subscriptions.push(watcher);
		
	context.subscriptions.push({
		dispose: () => {
			vscode.commands.executeCommand('setContext', 'luauModeSetterActivated', false);
		}
	});
}



// Deactivate function to dispose of all subscriptions
export function deactivate(context?: vscode.ExtensionContext) {
	if (context) {
		context.subscriptions.forEach(subscription => subscription.dispose());
		context.subscriptions.length = 0;  // Clear all subscriptions
	}
	vscode.window.showInformationMessage(PACKAGE_NAME + " Deactivated");
    vscode.commands.executeCommand('setContext', 'luauModeSetterActivated', false);

}
