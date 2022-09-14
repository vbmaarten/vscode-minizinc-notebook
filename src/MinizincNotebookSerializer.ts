import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';

export class MinizincNotebookSerializer implements vscode.NotebookSerializer {
	serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Uint8Array | Thenable<Uint8Array> {
		return new TextEncoder().encode(JSON.stringify(data));
	}
	
	deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): vscode.NotebookData | Thenable<vscode.NotebookData> {
		const contents = new TextDecoder().decode(content);
		try{
			const parsed = JSON.parse(contents);
		
			if(contents.trim() === ""){
				return new vscode.NotebookData([]);
			}

			const parsedCells = parsed.cells.map((cell: any) => {
				if(!cell.kind || !cell.value || !cell.languageId){
					throw Error('Malformed cell');
				}

				return new vscode.NotebookCellData(cell.kind, cell.value, cell.languageId);
			});
			
			return new vscode.NotebookData(parsedCells);
		} catch {
			return new vscode.NotebookData([]);
		}
	}
}