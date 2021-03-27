// import { PluginUtilities } from "../../../../src/plugins";
// import { DocxParser } from "../../../../src/office";
import {XmlNode, XmlParser/*, XmlParser*/} from "../../../../src/xml";
import * as xmldom from "xmldom";

import { DomPlugin} from "../../../../src/plugins/dom";
import { compressDomTreeToParagraphs } from "../../../../src/plugins/dom/blockUtils";
import { compressDomTreeToRuns } from "../../../../src/plugins/dom/inlineUtils";
import { TemplateContext } from "../../../../src/compilation";
import { readFixture } from "../../../fixtures/fixtureUtils";
import { Zip } from "../../../../src/zip";
import {DocxParser} from "../../../../src/office";
// import {TemplateHandler} from "../../../../src";
// import * as fs from "fs";

describe(nameof(DomPlugin), () => {

    const xmlDom = new xmldom.DOMParser();

    describe(nameof(compressDomTreeToParagraphs), () => {

        it("should flatten the dom tree correctly", () => {

            const doc = xmlDom.parseFromString(`
                <div>
                <p><b>bold</b></p>
                <p><h1>header1</h1><h3>header3</h3>not header</p>
                text
                </div>`.replace(/\s/g, ''), 'text/html');

            // const plugin = new DomPlugin();
            // const pluginUtilities: PluginUtilities = {
            //     docxParser: new DocxParser(new XmlParser())
            // } as any;
            // plugin.setUtilities(pluginUtilities);

            compressDomTreeToParagraphs(doc, doc.documentElement)
                .forEach(node => {
                    const xmlNode = XmlNode.fromDomNode(node);
                    console.log(XmlNode.serialize(xmlNode));
                });

        });

    });

    describe(nameof(compressDomTreeToRuns), () => {

        it("should flatten simple dom trees", async () => {
            const file = readFixture('simple.docx');
            const docx = await Zip.load(file)
                .then(zip => new DocxParser(new XmlParser()).load(zip));

            const contentParts = await docx.getContentParts();
            const context: TemplateContext = {
                docx,
                currentPart: contentParts[0]
            };

            const doc = xmlDom.parseFromString('<u><b>LOL</b><i><u>ASD</u></i><a href="www.google.com"><b>URL</b></a></u>', 'text/html');
            console.log(XmlNode.serialize(await compressDomTreeToRuns(context, doc.documentElement)));
        });

    });

    // describe("foobar", () => {
    //
    //     it("foobar", async () => {
    //
    //         const xmlDom = new xmldom.DOMParser();
    //
    //         const dom = xmlDom.parseFromString(`
    //             <div>
    //             <p><b>bold</b></p>
    //             <p><h1>header1</h1><h3>header3</h3>not header</p>
    //             text
    //             </div>`.replace(/\s/g, ''), 'text/html');
    //
    //         // 1. read template file
    //         const templateFile = fs.readFileSync('/code/docs/template0.docx');
    //
    //         // 2. process the template
    //         const data = {
    //             "dom": {
    //                 _type: 'dom',
    //                 dom: dom
    //             }
    //         };
    //
    //         const handler = new TemplateHandler();
    //         const doc = await handler.process(templateFile, data);
    //
    //         // 3. save output
    //         fs.writeFileSync('/code/docs/output0.docx', doc);
    //
    //     });
    //
    // });

});
