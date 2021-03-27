import { PluginContent } from "../pluginContent";

export interface DomContent extends PluginContent {
    _type: 'dom';
    dom: Document;
    style?: string;
}
