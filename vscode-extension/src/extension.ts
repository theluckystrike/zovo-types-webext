import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('@zovo/webext-types activated');
  
  const provider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'typescript' },
    {
      provideCompletionItems(doc, pos) {
        const line = doc.lineAt(pos.line).text;
        const items: vscode.CompletionItem[] = [];
        
        if (line.includes('chrome.') || line.includes('browser.')) {
          const apis = [
            'chrome.tabs.query', 'chrome.tabs.create', 'chrome.tabs.update',
            'chrome.storage.local.get', 'chrome.storage.local.set',
            'chrome.runtime.sendMessage', 'chrome.runtime.onMessage.addListener',
            'chrome.scripting.executeScript'
          ];
          
          apis.forEach(api => {
            const item = new vscode.CompletionItem(api, vscode.CompletionItemKind.Method);
            item.detail = api;
            items.push(item);
          });
        }
        
        return items;
      }
    }
  );
  
  context.subscriptions.push(provider);
}

export function deactivate() {}
