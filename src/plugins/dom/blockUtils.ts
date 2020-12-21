import { blockElements, inlineElements } from ".";

function createArtificialBlock(doc: Document, parent: Node, inlineNodes: Node[]): Node {
    const artificialNode = replaceNodeNameIfNeeded(doc, parent, doc.createElement('p'));
    inlineNodes.forEach(inn => artificialNode.appendChild(inn));
    return artificialNode;
}

function replaceNodeNameIfNeeded(doc: Document, parent: Node, child: Node): Node {
    // simply change the nodeName if the parent has a tag that has a lower
    // precedence. this is useful because if we have `<p><h1>A</h1></p>`, the
    // returned node should be `<h1>A</h1>` and not `<p>A</p>`.
    const parentPrecedence = blockElements.indexOf(parent.nodeName);
    const childPrecedence = blockElements.indexOf(child.nodeName);
    if (childPrecedence <= parentPrecedence) return child;

    const newChildNode = doc.createElement(parent.nodeName);
    Array.from(child.childNodes).forEach(cn => newChildNode.appendChild(cn));
    return newChildNode;
}

function isInlineElement(elem: Node): boolean {
    return inlineElements.includes(elem.nodeName);
}

// compress the DOM tree to a maximum height of 2, where paragraphs `w:p`
// contain inline elements `w:r`. the subtrees rooted at inline elements have
// arbitrary height, since those will be converted to `w:t`.
export function compressDomTreeToParagraphs(doc: Document, node: Node): Node[] {
    if (node.nodeName === 'hr' || isInlineElement(node))
        return [ node ]; // this is equivalent to multiple `w:r`
    if (!node.hasChildNodes())
        return []; // empty subtree, return nothing

    // collect all the flattened subtrees of all the child nodes
    const childNodes = Array.from(node.childNodes)
        .flatMap(cn => compressDomTreeToParagraphs(doc, cn));

    const [ blockNodes, inlineNodes ] =
        childNodes.reduce(([ blockNodes, inlineNodes ], childNode) => {
            // if it's a inline element, accumulate it
            if (isInlineElement(childNode))
                return [ blockNodes, inlineNodes.concat([ childNode ]) ];

            // it's a block element
            if (inlineNodes.length > 0) {
                // since there are pending inlines, we need to wrap them in an artificial
                // block node. this is the case where we have `<div>A<p>B</p></div>` which
                // is equivalent to `<div><p>A</p><p>B</p></div>`.
                blockNodes.push(createArtificialBlock(doc, node, inlineNodes));
            }
            // accumulate block level nodes
            childNode = replaceNodeNameIfNeeded(doc, node, childNode);
            return [ blockNodes.concat([ childNode ]), [] ];
        }, [[] as Node[], [] as Node[]]);

    if (inlineNodes.length > 0) {
        // wrap again in artificial node if there are inlines remaining
        blockNodes.push(createArtificialBlock(doc, node, inlineNodes));
    }
    // since `node` is a block element, and now `blockNodes` is guaranteed to only
    // contain block nodes itself, we return the children, shrinking by one the
    // height of the tree
    return blockNodes;
}
