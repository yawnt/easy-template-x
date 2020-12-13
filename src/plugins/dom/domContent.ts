import { PluginContent } from "../pluginContent";

export interface ImageContent extends PluginContent {
    _type: 'dom';
    dom: Document;
}
