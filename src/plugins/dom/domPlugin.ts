import { TemplatePlugin } from "../templatePlugin";
import { ScopeData, Tag, TemplateContext } from "../../compilation";
import { DomContent } from "./domContent";
import { XmlNode } from "../../xml";
import { compressDomTreeToParagraphs } from "./blockUtils";
import { compressDomTreeToRuns } from "./inlineUtils";

export class DomPlugin extends TemplatePlugin {
    public readonly contentType = 'dom';

    public async simpleTagReplacements(tag: Tag, data: ScopeData, context: TemplateContext): Promise<void> {

        const replaceNode = this.utilities.docxParser.containingParagraphNode(tag.xmlTextNode);

        const value = data.getScopeData<DomContent>();
        if (!value || !value.dom) {
            XmlNode.remove(replaceNode);
            return;
        }

        const xmlNodes = await Promise.all(
            compressDomTreeToParagraphs(value.dom, value.dom.documentElement)
                .map(paragraphNode => compressDomTreeToRuns(context, paragraphNode)));
            
        xmlNodes.forEach(xmlNode => XmlNode.insertBefore(xmlNode, replaceNode));
        XmlNode.remove(replaceNode);
    }

}
