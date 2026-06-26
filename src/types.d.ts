declare module "@opencode-ai/plugin" {
  export interface PluginModule {
    name: string;
    init(context: any): void;
  }
}
