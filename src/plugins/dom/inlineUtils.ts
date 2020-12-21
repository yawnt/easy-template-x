import { TEXT_NODE_NAME, XmlNode } from "../../xml";
import { TemplateContext } from "../../compilation";
import { DocxParser } from "../../office";

const linkRelType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';

function insertIfMissing(node: XmlNode, tag: string, index?: number): XmlNode {
    let tagNode = XmlNode.findChildByName(node, tag);
    if (tagNode) return tagNode;

    tagNode = XmlNode.createGeneralNode(tag);
    if (index >= 0) XmlNode.insertChild(node, tagNode, index);
    else XmlNode.appendChild(node, tagNode);
    return tagNode;
}

async function enhanceRPR(context: TemplateContext, node: Node, runNode: XmlNode): Promise<XmlNode> {
    const rprNode = insertIfMissing(runNode, DocxParser.RUN_PROPERTIES_NODE, 0)
    switch (node.nodeName) {
        case 'a':
            const elem = node as Element;
            const href = elem.getAttribute('href');
            if (href !== null && href !== "") {
                const rId = await context.currentPart.rels.add(href, linkRelType, 'External');
                const linkNode = XmlNode.createGeneralNode('w:hyperlink');
                linkNode.attributes = linkNode.attributes || {};
                linkNode.attributes["w:rId"] = rId;
                XmlNode.appendChild(linkNode, runNode);
                return linkNode;
            }
            break;
        case 'b':
        case 'strong':
            insertIfMissing(rprNode, 'w:b');
            break;
        case 'br':
            // TODO
            break;
        case 'em':
        case 'i':
            insertIfMissing(rprNode, 'w:i');
            break;
        case 'small':
            // TODO
            break;
        case 'u':
            insertIfMissing(rprNode, 'w:u');
            break;
        default:
            // label, span
            break;
    }
    return runNode;
}


async function compressDomTreeToRunsInner(context: TemplateContext, node: Node): Promise<XmlNode[]> {
    if (node.nodeName === TEXT_NODE_NAME) {
        const runNode = XmlNode.createGeneralNode(DocxParser.RUN_NODE);
        const textNode = XmlNode.createGeneralNode(DocxParser.TEXT_NODE);
        XmlNode.appendChild(textNode, XmlNode.createTextNode(node.textContent));
        XmlNode.appendChild(runNode, textNode);
        return [ runNode ];
    }

    const runNodes = [];
    for (const cn of Array.from(node.childNodes)) {
        const runs = await compressDomTreeToRunsInner(context, cn)
            .then(runs => runs.map(cr => enhanceRPR(context, node, cr)));
        runNodes.push(...await Promise.all(runs))
    }
    return runNodes;
}

export async function compressDomTreeToRuns(context: TemplateContext, node: Node): Promise<XmlNode> {
    const paragraphNode = XmlNode.createGeneralNode(DocxParser.PARAGRAPH_NODE);
    return compressDomTreeToRunsInner(context, node)
        .then(childNodes => childNodes.forEach(cn => XmlNode.appendChild(paragraphNode, cn)))
        .then(_ => paragraphNode);
}

