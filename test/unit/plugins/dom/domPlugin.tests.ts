import { DomPlugin } from "../../../../src/plugins/dom";
import { PluginUtilities } from "../../../../src/plugins";
import { DocxParser } from "../../../../src/office";
import {XmlNode, XmlParser} from "../../../../src/xml";
import * as xmldom from "xmldom";

describe(nameof(DomPlugin), () => {

    describe(nameof(DomPlugin.prototype.traverseDomTree), () => {

        it("should flatten the dom tree correctly", () => {

            const xmlDom = new xmldom.DOMParser();
            const doc = xmlDom.parseFromString(`
                <div>
                <p><b>bold</b></p>
                <p><h1>header1</h1><h3>header3</h3>not header</p>
                text
                </div>`.replace(/\s/g, ''), 'text/html');

            const plugin = new DomPlugin();
            const pluginUtilities: PluginUtilities = {
                docxParser: new DocxParser(new XmlParser())
            } as any;
            plugin.setUtilities(pluginUtilities);

            plugin.traverseDomTree(doc, doc.documentElement)
                .forEach(node => {
                    const xmlNode = XmlNode.fromDomNode(node);
                    console.log(XmlNode.serialize(xmlNode));
                });

        });

    });

});
