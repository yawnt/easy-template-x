import { TemplatePlugin } from "../templatePlugin";
import { ScopeData, Tag, TemplateContext } from "../../compilation";

export class DomPlugin extends TemplatePlugin {
    public readonly contentType = 'dom';

    public async simpleTagReplacements(tag: Tag, data: ScopeData, context: TemplateContext): Promise<void> {
        return;
    }


}
