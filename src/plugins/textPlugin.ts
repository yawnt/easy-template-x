import { ScopeData, Tag, TagDisposition, TagPrefix } from '../compilation';
import { DocxParser } from '../docxParser';
import { XmlNode, XmlNodeType, XmlTextNode } from '../xmlNode';
import { TemplatePlugin } from './templatePlugin';

export class TextPlugin extends TemplatePlugin {

    public readonly prefixes: TagPrefix[] = [{
        prefix: '',
        tagType: 'text',
        tagDisposition: TagDisposition.SelfClosed
    }];

    /**
     * Replace the node text content with the specified value. The value is
     * xml-encoded by the plugin.
     */
    public simpleTagReplacements(tag: Tag, data: ScopeData): void {

        const value = (data.getScopeData() || '').split('\n');

        if (value.length < 2) {
            this.replaceSingleLine(tag.xmlTextNode, value.length ? value[0] : '');
        } else {
            this.replaceMultiLine(tag.xmlTextNode, value);
        }
    }

    private replaceSingleLine(textNode: XmlTextNode, text: string) {
        textNode.textContent = text;
    }

    private replaceMultiLine(textNode: XmlTextNode, lines: string[]) {

        const runNode = this.utilities.docxParser.containingRunNode(textNode);

        // first lint
        textNode.textContent = lines[0];

        // other lines
        for (let i = 1; i < lines.length; i++) {

            // add line break
            const lineBreak = this.getLineBreak();
            XmlNode.appendChild(runNode, lineBreak);

            // add text
            const lineNode = this.createWordTextNode(lines[i]);
            XmlNode.appendChild(runNode, lineNode);
        }
    }

    private getLineBreak(): XmlNode {
        return {
            nodeType: XmlNodeType.General,
            nodeName: 'w:br'
        };
    }

    private createWordTextNode(text: string): XmlNode {
        const wordTextNode = XmlNode.createGeneralNode(DocxParser.TEXT_NODE);
        wordTextNode.childNodes = [
            XmlNode.createTextNode(text)
        ];
        return wordTextNode;
    }
}