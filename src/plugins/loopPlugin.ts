import { ScopeData, Tag, TemplateContext } from '../compilation';
import { last } from '../utils';
import { XmlNode } from '../xmlNode';
import { ILoopStrategy, LoopListStrategy, LoopParagraphStrategy, LoopTableStrategy } from './loop';
import { PluginUtilities, TemplatePlugin } from './templatePlugin';

export class LoopPlugin extends TemplatePlugin {

    public readonly tagType = 'loop';

    private readonly loopStrategies: ILoopStrategy[] = [
        new LoopTableStrategy(),
        new LoopListStrategy(),
        new LoopParagraphStrategy() // the default strategy
    ];

    public setUtilities(utilities: PluginUtilities) {
        this.utilities = utilities;
        this.loopStrategies.forEach(strategy => strategy.setUtilities(utilities));
    }    

    public containerTagReplacements(tags: Tag[], data: ScopeData, context: TemplateContext): void {

        let value: any[] = data.getScopeData();

        if (!value || !Array.isArray(value) || !value.length)
            value = [];

        // vars
        const openTag = tags[0];
        const closeTag = last(tags);

        // select the suitable strategy
        const loopStrategy = this.loopStrategies.find(strategy => strategy.isApplicable(openTag, closeTag));
        if (!loopStrategy)
            throw new Error(`No loop strategy found for tag '${openTag.rawText}'.`);

        // prepare to loop
        const { firstNode, nodesToRepeat, lastNode } = loopStrategy.splitBefore(openTag, closeTag);

        // repeat (loop) the content
        const repeatedNodes = this.repeat(nodesToRepeat, value.length);

        // recursive compilation 
        // (this step can be optimized in the future if we'll keep track of the
        // path to each token and use that to create new tokens instead of
        // search through the text again)
        const compiledNodes = this.compile(repeatedNodes, data, context);

        // merge back to the document
        loopStrategy.mergeBack(compiledNodes, firstNode, lastNode);
    }

    private repeat(nodes: XmlNode[], times: number): XmlNode[][] {
        if (!nodes.length || !times)
            return [];

        const allResults: XmlNode[][] = [];

        for (let i = 0; i < times; i++) {
            const curResult = nodes.map(node => XmlNode.cloneNode(node, true));
            allResults.push(curResult);
        }

        return allResults;
    }

    private compile(nodeGroups: XmlNode[][], data: ScopeData, context: TemplateContext): XmlNode[][] {
        const compiledNodeGroups: XmlNode[][] = [];

        // compile each node group with it's relevant data
        for (let i = 0; i < nodeGroups.length; i++) {

            // create dummy root node
            const curNodes = nodeGroups[i];
            const dummyRootNode = XmlNode.createGeneralNode('dummyRootNode');
            curNodes.forEach(node => XmlNode.appendChild(dummyRootNode, node));

            // compile the new root
            data.path.push(i);
            this.utilities.compiler.compile(dummyRootNode, data, context);
            data.path.pop();

            // disconnect from dummy root
            const curResult: XmlNode[] = [];
            while (dummyRootNode.childNodes && dummyRootNode.childNodes.length) {
                const child = XmlNode.removeChild(dummyRootNode, 0);
                curResult.push(child);
            }
            compiledNodeGroups.push(curResult);
        }

        return compiledNodeGroups;
    }
}