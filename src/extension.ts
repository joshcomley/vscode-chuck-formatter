import * as vscode from 'vscode';
import { ChucKFormatter } from './chuck-formatter';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.languages.registerDocumentFormattingEditProvider('chuck', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const lastLine = document.lineAt(document.lineCount - 1);
			const range = new vscode.Range(0, 0, document.lineCount - 1, lastLine.range.end.character);
			const text = document.getText();
			try {
				return [vscode.TextEdit.replace(range, new ChucKFormatter().format(text))];
				// const tokens = lexChuck(text);
				// const formattedCode = formatChuck(tokens);
				// return [vscode.TextEdit.replace(range, formattedCode)];
			} catch (error) {
				console.error("Formatting error:", error);
				return [];
			}
		}
	});

	context.subscriptions.push(disposable);
}