export {};

declare global {
  interface Window {
    require: any;
    process?: {
      type?: string;
    };
    Capacitor?: any;
    electronAPI: {
      saveFile: (
        filename: string,
        content: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;

      loadFile: (filename: string) => Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>;
    };
  }
}
