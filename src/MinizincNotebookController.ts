import { exec } from 'child_process';
import { fileSync } from 'tmp';
import { write, writeFileSync } from 'fs';
import * as vscode from 'vscode';

const minizincNotebookHandler: Parameters<typeof vscode.notebooks.createNotebookController>[3] = 
    (cells, notebook, controller) => {
        cells.forEach((cell, index) => {
            const execution = controller.createNotebookCellExecution(cell);
            execution.executionOrder = index;

            execution.start(Date.now());
            
            const tmpFile = fileSync({postfix: '.mzn'});
            const cellContent = cell.document.getText();
            
            const firstLine = cell.document.lineAt(0).text;
            let extraArguments = "";

            if(firstLine.startsWith("% args: ")){
                extraArguments = firstLine.substring(8);
            }

            writeFileSync(tmpFile.fd, cellContent);
            
            const executionCommand = `minizinc --solver org.gecode.gecode ${extraArguments} ${tmpFile.name}`;

            exec(executionCommand, (error, stdout) => {
                execution.replaceOutput(
                    new vscode.NotebookCellOutput([
                        error === null ?
                            vscode.NotebookCellOutputItem.stdout(stdout) :
                            vscode.NotebookCellOutputItem.stderr(stdout)
                    ])
                );
                
                tmpFile.removeCallback();
                execution.end(error === null, Date.now());
            });
        });
    };

export const createMinzincNotebookController = () => {
    const controllerId = 'minizinc-notebook-controller';
    const notebookType = 'minizinc-notebook';
    const label = 'Minizinc Notebook';
    const supportedLanguages = ['minizinc'];
    
    const controller = vscode.notebooks.createNotebookController(controllerId, notebookType, label, minizincNotebookHandler);
    controller.supportedLanguages = supportedLanguages;
    
    return controller;
};